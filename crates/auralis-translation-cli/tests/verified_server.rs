use auralis_translation::{RunId, RunState, SourceHash};
use auralis_translation_sqlite::{SqliteConfig, TranslateDb};
use std::{
    error::Error,
    io::{Read, Write},
    net::TcpListener,
    path::Path,
    process::Command,
    time::{Duration, Instant, SystemTime, UNIX_EPOCH},
};

const CHECKED_PROFILE: &[u8] =
    include_bytes!("../../../models/manifests/hy_mt2_1_8b_q4_k_m.checked.experimental.json");
const SOURCE: &[u8] = b"1\n00:00:01,000 --> 00:00:02,000\n\xe4\xbd\xa0\xe5\xa5\xbd\xe3\x80\x82\n";
const MODEL: &[u8] = b"synthetic model file";
const MODEL_ALIAS: &str = "auralis-hy-mt2-1.8b-q4";
const BUILD_INFO: &str = "b10977-0ecb159c9";

#[test]
fn checked_profile_probes_server_and_hashes_reported_local_model() -> Result<(), Box<dyn Error>> {
    let nonce = SystemTime::now().duration_since(UNIX_EPOCH)?.as_nanos();
    let directory = std::env::temp_dir().join(format!(
        "auralis-server-check-{}-{nonce}",
        std::process::id()
    ));
    std::fs::create_dir(&directory)?;
    let source_path = directory.join("source.srt");
    let model_path = directory.join("model.gguf");
    let profile_path = directory.join("profile.json");
    std::fs::write(&source_path, SOURCE)?;
    std::fs::write(&model_path, MODEL)?;
    let mut profile: serde_json::Value = serde_json::from_slice(CHECKED_PROFILE)?;
    profile["model_file_sha256"] = serde_json::json!(SourceHash::digest(MODEL).to_string());
    profile["model_file_bytes"] = serde_json::json!(MODEL.len());
    std::fs::write(&profile_path, serde_json::to_vec(&profile)?)?;

    let listener = TcpListener::bind("127.0.0.1:0")?;
    let endpoint = format!("http://{}/", listener.local_addr()?);
    let model_path_for_server = path(&model_path)?.to_owned();
    let server = std::thread::spawn(move || serve(listener, &model_path_for_server, true));
    let state_dir = directory.join("good-state");
    let output_path = directory.join("good-output.srt");
    let output = command(&[
        "translate",
        path(&source_path)?,
        path(&state_dir)?,
        path(&profile_path)?,
        &endpoint,
        path(&output_path)?,
    ])?;
    assert!(
        output.status.success(),
        "{}",
        String::from_utf8_lossy(&output.stderr)
    );
    assert!(String::from_utf8_lossy(&output.stderr).contains("model_ready alias="));
    server.join().map_err(|_| "mock server panicked")??;
    assert!(String::from_utf8(std::fs::read(&output_path)?)?.contains("Привет."));
    assert_eq!(std::fs::read(&source_path)?, SOURCE);

    profile["model_file_sha256"] =
        serde_json::json!(SourceHash::digest(b"different model").to_string());
    std::fs::write(&profile_path, serde_json::to_vec(&profile)?)?;
    let listener = TcpListener::bind("127.0.0.1:0")?;
    let endpoint = format!("http://{}/", listener.local_addr()?);
    let model_path_for_server = path(&model_path)?.to_owned();
    let server = std::thread::spawn(move || serve(listener, &model_path_for_server, false));
    let state_dir = directory.join("bad-state");
    let output_path = directory.join("bad-output.srt");
    let output = command(&[
        "translate",
        path(&source_path)?,
        path(&state_dir)?,
        path(&profile_path)?,
        &endpoint,
        path(&output_path)?,
    ])?;
    assert!(!output.status.success());
    assert!(String::from_utf8_lossy(&output.stderr).contains("hash differs from profile"));
    server.join().map_err(|_| "mock server panicked")??;
    assert!(!output_path.exists());
    let stdout = String::from_utf8(output.stdout)?;
    let run_id = stdout
        .split_whitespace()
        .find_map(|item| item.strip_prefix("run_id="))
        .ok_or("CLI did not announce its run ID")?;
    let run_id = RunId::parse(run_id)?;
    let db = TranslateDb::open(
        &state_dir.join("auralis-translate.sqlite"),
        SqliteConfig::default(),
    )?;
    assert_eq!(db.run_state(run_id)?, RunState::Requested);
    assert!(db.checkpoints(run_id)?.is_empty());
    drop(db);
    std::fs::remove_dir_all(directory)?;
    Ok(())
}

fn command(args: &[&str]) -> Result<std::process::Output, Box<dyn Error>> {
    Ok(Command::new(env!("CARGO_BIN_EXE_auralis-translation-cli"))
        .args(args)
        .output()?)
}

fn path(path: &Path) -> Result<&str, Box<dyn Error>> {
    Ok(path.to_str().ok_or("test path must be Unicode")?)
}

fn serve(listener: TcpListener, model_path: &str, expect_chat: bool) -> Result<(), String> {
    listener
        .set_nonblocking(true)
        .map_err(|error| error.to_string())?;
    let expected = if expect_chat { 4 } else { 3 };
    let started = Instant::now();
    for index in 0..expected {
        let mut stream = loop {
            match listener.accept() {
                Ok((stream, _)) => break stream,
                Err(error) if error.kind() == std::io::ErrorKind::WouldBlock => {
                    if started.elapsed() > Duration::from_secs(20) {
                        return Err(format!("timed out waiting for request {index}"));
                    }
                    std::thread::sleep(Duration::from_millis(10));
                }
                Err(error) => return Err(error.to_string()),
            }
        };
        stream
            .set_read_timeout(Some(Duration::from_secs(5)))
            .map_err(|error| error.to_string())?;
        let request = read_request(&mut stream)?;
        let body = match request.as_str() {
            "GET /health" => serde_json::json!({"status":"ok"}),
            "GET /props" => serde_json::json!({
                "model_path": model_path,
                "model_alias": MODEL_ALIAS,
                "build_info": BUILD_INFO,
                "default_generation_settings": {"n_ctx": 2048}
            }),
            "GET /v1/models" => serde_json::json!({"data":[{"id":MODEL_ALIAS}]}),
            "POST /v1/chat/completions" if expect_chat => serde_json::json!({
                "choices":[{"message":{"content":"Привет."},"finish_reason":"stop"}]
            }),
            _ => return Err(format!("unexpected request: {request}")),
        };
        let body = body.to_string();
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

fn read_request(stream: &mut std::net::TcpStream) -> Result<String, String> {
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
                .unwrap_or(0);
            if raw.len() >= header_end + 4 + length {
                return Ok(header
                    .lines()
                    .next()
                    .unwrap_or_default()
                    .trim_end_matches(" HTTP/1.1")
                    .to_owned());
            }
        }
    }
}
