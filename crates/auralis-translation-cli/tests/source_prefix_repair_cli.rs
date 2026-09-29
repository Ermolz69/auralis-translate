#[path = "support/machine_workspace.rs"]
mod machine_workspace;

use auralis_translation::{DiagnosticCode, InferenceRequestOutcome, RunId, RunState, SourceHash};
use auralis_translation_sqlite::{SqliteConfig, TranslateDb};
use serde_json::{Value, json};
use std::error::Error;
use std::io::{Read, Write};
use std::net::TcpListener;
use std::path::Path;
use std::process::Command;
use std::time::{Duration, Instant};

const PROFILE: &[u8] = include_bytes!(
    "../../../models/manifests/hy_mt2_1_8b_q4_k_m.context_v6_prefix_repair.experimental.json"
);
const MODEL: &[u8] = b"synthetic checked model for CLI persistence test";
const SOURCE: &str = "1\n00:00:01,000 --> 00:00:02,000\n工程 AUR-0002：不要打开这扇门。\n\n2\n00:00:03,000 --> 00:00:04,000\n工程 DOC-42：已经检查。\n";

#[test]
fn repaired_prefix_survives_failure_and_resume_without_partial_publication()
-> Result<(), Box<dyn Error>> {
    let workspace = machine_workspace::MachineWorkspace::new()?;
    let source = workspace.0.join("original.srt");
    let model = workspace.0.join("model.gguf");
    let profile = workspace.0.join("profile.json");
    let state = workspace.0.join("state");
    let output = workspace.0.join("result.srt");
    std::fs::write(&source, SOURCE)?;
    std::fs::write(&model, MODEL)?;
    let mut checked: Value = serde_json::from_slice(PROFILE)?;
    checked["model_file_sha256"] = json!(SourceHash::digest(MODEL).to_string());
    checked["model_file_bytes"] = json!(MODEL.len());
    checked["context_before_segments"] = json!(0);
    checked["context_after_segments"] = json!(0);
    checked["max_context_bytes"] = json!(0);
    checked["token_safety_margin_tokens"] = Value::Null;
    std::fs::write(&profile, serde_json::to_vec(&checked)?)?;

    let listener = TcpListener::bind("127.0.0.1:0")?;
    let endpoint = format!("http://{}/", listener.local_addr()?);
    let model_path = path(&model)?.to_owned();
    let server = std::thread::spawn(move || {
        serve(
            listener,
            &model_path,
            &[(1, "Не открывайте эту дверь."), (2, "DOC-43: Проверено.")],
        )
    });
    let first = command(&[
        "translate",
        path(&source)?,
        path(&state)?,
        path(&profile)?,
        &endpoint,
        path(&output)?,
    ])?;
    let server_result = server.join().map_err(|_| "server panicked")?;
    server_result?;
    assert!(!first.status.success());
    assert!(!output.exists());
    let stdout = String::from_utf8(first.stdout)?;
    let run_id = stdout
        .split_whitespace()
        .find_map(|part| part.strip_prefix("run_id="))
        .ok_or("missing run ID")?;
    let run_id = RunId::parse(run_id)?;
    let db_path = state.join("auralis-translate.sqlite");
    let db = TranslateDb::open(&db_path, SqliteConfig::default())?;
    assert_eq!(db.run_state(run_id)?, RunState::Failed);
    assert_eq!(db.checkpoints(run_id)?.len(), 1);
    assert!(db.result_for_run(run_id).is_err());
    let warnings = db.diagnostics(run_id)?;
    assert_eq!(warnings.len(), 1);
    assert_eq!(
        warnings[0].diagnostic.code,
        DiagnosticCode::SourcePrefixInserted
    );
    assert_eq!(warnings[0].diagnostic.segment_id.get(), 1);
    let requests = db.inference_requests(run_id)?;
    assert_eq!(requests.len(), 2);
    assert_eq!(
        requests[0]
            .finish
            .as_ref()
            .and_then(|finish| finish.restored_candidate.as_deref()),
        Some("Не открывайте эту дверь.")
    );
    assert_eq!(
        requests[0].finish.as_ref().map(|finish| finish.outcome),
        Some(InferenceRequestOutcome::ValidatedLine)
    );
    assert_eq!(
        requests[1]
            .finish
            .as_ref()
            .and_then(|finish| finish.restored_candidate.as_deref()),
        Some("DOC-43: Проверено.")
    );
    assert_eq!(
        requests[1].finish.as_ref().map(|finish| finish.outcome),
        Some(InferenceRequestOutcome::InvalidCandidate)
    );
    assert!(requests.iter().all(|request| {
        request
            .finish
            .as_ref()
            .is_some_and(|finish| finish.raw_response.is_some())
    }));
    drop(db);

    let listener = TcpListener::bind("127.0.0.1:0")?;
    let endpoint = format!("http://{}/", listener.local_addr()?);
    let model_path = path(&model)?.to_owned();
    let server =
        std::thread::spawn(move || serve(listener, &model_path, &[(2, "DOC-42: Проверено.")]));
    let resumed = command(&[
        "resume",
        path(&state)?,
        &run_id.to_string(),
        path(&profile)?,
        &endpoint,
        path(&output)?,
    ])?;
    let server_result = server.join().map_err(|_| "resume server panicked")?;
    server_result?;
    assert!(
        resumed.status.success(),
        "{}",
        String::from_utf8_lossy(&resumed.stderr)
    );
    let rendered = String::from_utf8(std::fs::read(&output)?)?;
    assert!(rendered.contains("AUR-0002: Не открывайте эту дверь."));
    assert!(rendered.contains("DOC-42: Проверено."));
    assert!(rendered.contains("00:00:01,000 --> 00:00:02,000"));
    assert!(rendered.contains("00:00:03,000 --> 00:00:04,000"));
    assert_eq!(std::fs::read(&source)?, SOURCE.as_bytes());
    let db = TranslateDb::open(&db_path, SqliteConfig::default())?;
    assert_eq!(db.run_state(run_id)?, RunState::Validated);
    assert_eq!(db.checkpoints(run_id)?.len(), 2);
    assert_eq!(db.diagnostics(run_id)?.len(), 1);
    assert_eq!(db.inference_requests(run_id)?.len(), 3);
    drop(db);

    let exported = workspace.0.join("exported.srt");
    let offline = command(&[
        "resume",
        path(&state)?,
        &run_id.to_string(),
        path(&profile)?,
        "http://127.0.0.1:1/",
        path(&exported)?,
    ])?;
    assert!(
        offline.status.success(),
        "{}",
        String::from_utf8_lossy(&offline.stderr)
    );
    assert_eq!(std::fs::read(&exported)?, std::fs::read(&output)?);
    Ok(())
}

fn serve(
    listener: TcpListener,
    model_path: &str,
    translations: &[(u64, &str)],
) -> Result<(), String> {
    listener
        .set_nonblocking(true)
        .map_err(|error| error.to_string())?;
    let started = Instant::now();
    for request_index in 0..3 + translations.len() {
        let mut stream = loop {
            match listener.accept() {
                Ok((stream, _)) => break stream,
                Err(error) if error.kind() == std::io::ErrorKind::WouldBlock => {
                    if started.elapsed() > Duration::from_secs(20) {
                        return Err(format!("timed out on request {request_index}"));
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
            "GET /health" => json!({"status":"ok"}),
            "GET /props" => json!({
                "model_path": model_path,
                "model_alias": "auralis-hy-mt2-1.8b-q4",
                "build_info": "b10977-0ecb159c9",
                "default_generation_settings": {"n_ctx": 2048}
            }),
            "GET /v1/models" => json!({"data":[{"id":"auralis-hy-mt2-1.8b-q4"}]}),
            "POST /v1/chat/completions" => {
                let (segment_id, text) = translations
                    .get(request_index - 3)
                    .ok_or("unexpected translation request")?;
                let content = json!({
                    "translations": [{"segment_id": segment_id, "line_index": 0, "text": text}]
                })
                .to_string();
                json!({"choices":[{"message":{"content":content},"finish_reason":"stop"}]})
            }
            _ => return Err(format!("unexpected request {request}")),
        };
        let body = body.to_string();
        write!(
            stream,
            "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}",
            body.len()
        )
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

fn command(args: &[&str]) -> Result<std::process::Output, Box<dyn Error>> {
    Ok(Command::new(env!("CARGO_BIN_EXE_auralis-translation-cli"))
        .args(args)
        .output()?)
}

fn path(path: &Path) -> Result<&str, Box<dyn Error>> {
    Ok(path.to_str().ok_or("test path must be Unicode")?)
}
