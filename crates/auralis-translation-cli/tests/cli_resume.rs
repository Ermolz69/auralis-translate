use auralis_translation::{RunId, RunState};
use auralis_translation_sqlite::{SqliteConfig, TranslateDb};
use std::error::Error;
use std::io::{Read, Write};
use std::net::TcpListener;
use std::path::Path;
use std::process::Command;
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};

const PROFILE: &[u8] =
    include_bytes!("../../../models/manifests/hy_mt2_1_8b_q4_k_m.experimental.json");

#[test]
fn cli_resumes_checkpointed_srt_and_reexports_validated_result() -> Result<(), Box<dyn Error>> {
    let nonce = SystemTime::now().duration_since(UNIX_EPOCH)?.as_nanos();
    let directory =
        std::env::temp_dir().join(format!("auralis-cli-resume-{}-{nonce}", std::process::id()));
    std::fs::create_dir(&directory)?;
    let source_path = directory.join("original.srt");
    let state_dir = directory.join("state");
    let profile_path = directory.join("profile.json");
    let output_path = directory.join("russian.srt");
    let export_path = directory.join("russian-again.srt");
    let source = source_with_nine_cues();
    std::fs::write(&source_path, &source)?;
    std::fs::write(&profile_path, PROFILE)?;

    let listener = TcpListener::bind("127.0.0.1:0")?;
    let endpoint = format!("http://{}/", listener.local_addr()?);
    let server = std::thread::spawn(move || serve(listener, 9, Some(9)));
    let first = command(&[
        "translate",
        path(&source_path)?,
        path(&state_dir)?,
        path(&profile_path)?,
        &endpoint,
        path(&output_path)?,
    ])?;
    assert!(!first.status.success());
    server.join().map_err(|_| "first mock server panicked")??;
    assert!(!output_path.exists());
    let stdout = String::from_utf8(first.stdout)?;
    let run_id = stdout
        .split_whitespace()
        .find_map(|item| item.strip_prefix("run_id="))
        .ok_or("CLI did not report a run ID")?;
    let run_id = RunId::parse(run_id)?;
    let mut db = TranslateDb::open(
        &state_dir.join("auralis-translate.sqlite"),
        SqliteConfig::default(),
    )?;
    assert_eq!(db.run_state(run_id)?, RunState::Failed);
    assert_eq!(db.checkpoints(run_id)?.len(), 1);
    drop(db);

    let listener = TcpListener::bind("127.0.0.1:0")?;
    let endpoint = format!("http://{}/", listener.local_addr()?);
    let server = std::thread::spawn(move || serve(listener, 1, None));
    let resumed = command(&[
        "resume",
        path(&state_dir)?,
        &run_id.to_string(),
        path(&profile_path)?,
        &endpoint,
        path(&output_path)?,
    ])?;
    assert!(
        resumed.status.success(),
        "{}",
        String::from_utf8_lossy(&resumed.stderr)
    );
    server.join().map_err(|_| "second mock server panicked")??;
    assert_eq!(std::fs::read(&source_path)?, source);
    let translated = std::fs::read(&output_path)?;
    assert_eq!(
        translated
            .windows("Привет.".len())
            .filter(|part| *part == "Привет.".as_bytes())
            .count(),
        9
    );
    db = TranslateDb::open(
        &state_dir.join("auralis-translate.sqlite"),
        SqliteConfig::default(),
    )?;
    assert_eq!(db.run_state(run_id)?, RunState::Validated);
    assert_eq!(db.result_for_run(run_id)?.selected.len(), 9);
    let managed_source = db
        .translation(db.run(run_id)?.translation_id)?
        .source_locator
        .ok_or("managed source locator missing")?;
    drop(db);

    std::fs::write(&managed_source, b"changed")?;
    let changed_source = command(&[
        "resume",
        path(&state_dir)?,
        &run_id.to_string(),
        path(&profile_path)?,
        "http://127.0.0.1:1/",
        path(&export_path)?,
    ])?;
    assert!(!changed_source.status.success());
    assert!(!export_path.exists());
    std::fs::write(&managed_source, &source)?;

    let mut changed_profile = PROFILE.to_vec();
    changed_profile.push(b' ');
    std::fs::write(&profile_path, changed_profile)?;
    let profile_conflict = command(&[
        "resume",
        path(&state_dir)?,
        &run_id.to_string(),
        path(&profile_path)?,
        "http://127.0.0.1:1/",
        path(&export_path)?,
    ])?;
    assert!(!profile_conflict.status.success());
    assert!(!export_path.exists());
    std::fs::write(&profile_path, PROFILE)?;

    let export = command(&[
        "resume",
        path(&state_dir)?,
        &run_id.to_string(),
        path(&profile_path)?,
        "http://127.0.0.1:1/",
        path(&export_path)?,
    ])?;
    assert!(
        export.status.success(),
        "{}",
        String::from_utf8_lossy(&export.stderr)
    );
    assert_eq!(std::fs::read(&export_path)?, translated);
    let overwrite = command(&[
        "resume",
        path(&state_dir)?,
        &run_id.to_string(),
        path(&profile_path)?,
        "http://127.0.0.1:1/",
        path(&export_path)?,
    ])?;
    assert!(!overwrite.status.success());
    assert_eq!(std::fs::read(&export_path)?, translated);
    std::fs::remove_dir_all(directory)?;
    Ok(())
}

fn source_with_nine_cues() -> Vec<u8> {
    let mut text = String::new();
    for index in 1..=9 {
        text.push_str(&format!(
            "{index}\n00:00:{index:02},000 --> 00:00:{:02},000\n你好。\n\n",
            index + 1
        ));
    }
    text.into_bytes()
}

fn command(args: &[&str]) -> Result<std::process::Output, Box<dyn Error>> {
    Ok(Command::new(env!("CARGO_BIN_EXE_auralis-translation-cli"))
        .args(args)
        .output()?)
}

fn path(path: &Path) -> Result<&str, Box<dyn Error>> {
    Ok(path.to_str().ok_or("test path must be Unicode")?)
}

fn serve(listener: TcpListener, count: usize, fail_on: Option<usize>) -> Result<(), String> {
    listener
        .set_nonblocking(true)
        .map_err(|error| error.to_string())?;
    let started = Instant::now();
    for request_index in 1..=count {
        let mut stream = loop {
            match listener.accept() {
                Ok((stream, _)) => break stream,
                Err(error) if error.kind() == std::io::ErrorKind::WouldBlock => {
                    if started.elapsed() > Duration::from_secs(20) {
                        return Err(format!("timed out waiting for request {request_index}"));
                    }
                    std::thread::sleep(Duration::from_millis(10));
                }
                Err(error) => return Err(error.to_string()),
            }
        };
        stream
            .set_read_timeout(Some(Duration::from_secs(5)))
            .map_err(|error| error.to_string())?;
        read_request(&mut stream)?;
        let finish = if fail_on == Some(request_index) {
            "length"
        } else {
            "stop"
        };
        let body = format!(
            r#"{{"choices":[{{"message":{{"content":"Привет."}},"finish_reason":"{finish}"}}]}}"#
        );
        let response = format!(
            "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}",
            body.len()
        );
        stream
            .write_all(response.as_bytes())
            .map_err(|error| error.to_string())?;
    }
    Ok(())
}

fn read_request(stream: &mut std::net::TcpStream) -> Result<(), String> {
    let mut raw = Vec::new();
    let mut buffer = [0_u8; 4096];
    loop {
        let count = stream
            .read(&mut buffer)
            .map_err(|error| error.to_string())?;
        if count == 0 {
            return Err("request ended early".into());
        }
        raw.extend_from_slice(&buffer[..count]);
        if let Some(header_end) = raw.windows(4).position(|part| part == b"\r\n\r\n") {
            let header =
                std::str::from_utf8(&raw[..header_end]).map_err(|error| error.to_string())?;
            let length = header
                .lines()
                .find_map(|line| {
                    line.to_ascii_lowercase()
                        .strip_prefix("content-length: ")
                        .and_then(|value| value.parse::<usize>().ok())
                })
                .ok_or("missing request length")?;
            if raw.len() >= header_end + 4 + length {
                return Ok(());
            }
        }
    }
}
