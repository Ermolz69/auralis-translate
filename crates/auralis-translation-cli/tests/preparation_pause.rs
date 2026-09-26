#[path = "support/cli_child.rs"]
mod cli_child;
#[path = "support/machine_workspace.rs"]
mod machine_workspace;

use auralis_translation::{RunId, RunState, SourceHash};
use auralis_translation_sqlite::{SqliteConfig, TranslateDb};
use std::{
    error::Error,
    io::{BufRead, BufReader, Read},
    net::TcpListener,
    process::{Command, Stdio},
    sync::mpsc,
    time::{Duration, Instant},
};

const PROFILE: &[u8] =
    include_bytes!("../../../models/manifests/hy_mt2_1_8b_q4_k_m.checked.experimental.json");
const SOURCE: &[u8] = b"1\n00:00:01,000 --> 00:00:02,000\nhello\n";
const TIMEOUT: Duration = Duration::from_secs(5);

#[test]
fn initial_and_repeated_resume_pause_interrupt_cli_preflight() -> Result<(), Box<dyn Error>> {
    let directory = machine_workspace::MachineWorkspace::new()?;
    let source = directory.0.join("source.srt");
    let profile = directory.0.join("profile.json");
    let state = directory.0.join("state");
    let output = directory.0.join("output.srt");
    std::fs::write(&source, SOURCE)?;
    let mut manifest: serde_json::Value = serde_json::from_slice(PROFILE)?;
    manifest["model_file_bytes"] = serde_json::json!(9);
    manifest["model_file_sha256"] = serde_json::json!(SourceHash::digest(b"synthetic").to_string());
    std::fs::write(&profile, serde_json::to_vec(&manifest)?)?;
    let mut retained_run = None;
    for resume in [false, true] {
        let listener = TcpListener::bind("127.0.0.1:0")?;
        let endpoint = format!("http://{}/", listener.local_addr()?);
        let (ready_tx, ready_rx) = mpsc::channel();
        let server = std::thread::spawn(move || -> Result<(), String> {
            listener
                .set_nonblocking(true)
                .map_err(|cause| cause.to_string())?;
            let started = Instant::now();
            let mut stream = loop {
                match listener.accept() {
                    Ok((stream, _)) => break stream,
                    Err(cause)
                        if cause.kind() == std::io::ErrorKind::WouldBlock
                            && started.elapsed() < TIMEOUT =>
                    {
                        std::thread::sleep(Duration::from_millis(10))
                    }
                    Err(cause) => return Err(cause.to_string()),
                }
            };
            stream
                .set_nonblocking(false)
                .map_err(|cause| cause.to_string())?;
            stream
                .set_read_timeout(Some(TIMEOUT))
                .map_err(|cause| cause.to_string())?;
            let mut request = Vec::new();
            let mut buffer = [0; 4096];
            while !request.windows(4).any(|part| part == b"\r\n\r\n") {
                let count = stream
                    .read(&mut buffer)
                    .map_err(|cause| cause.to_string())?;
                if count == 0 {
                    return Err("preflight ended early".into());
                }
                request.extend_from_slice(&buffer[..count]);
            }
            if !request.starts_with(b"GET /health ") {
                return Err("expected readiness probe".into());
            }
            ready_tx.send(()).map_err(|cause| cause.to_string())?;
            match stream.read(&mut buffer) {
                Ok(0) => Ok(()),
                Err(cause) if cause.kind() == std::io::ErrorKind::ConnectionReset => Ok(()),
                other => Err(format!("preflight request was not released: {other:?}")),
            }
        });
        let mut command = Command::new(env!("CARGO_BIN_EXE_auralis-translation-cli"));
        command.arg("--jsonl");
        if resume {
            command
                .arg("resume")
                .arg(&state)
                .arg(retained_run.as_ref().ok_or("missing run")?);
        } else {
            command.arg("translate").arg(&source).arg(&state);
        }
        let mut child = cli_child::CliChild(
            command
                .arg(&profile)
                .arg(endpoint)
                .arg(&output)
                .stdout(Stdio::piped())
                .stderr(Stdio::null())
                .spawn()?,
        );
        let mut reader = BufReader::new(child.stdout.take().ok_or("missing stdout")?);
        let mut first = String::new();
        reader.read_line(&mut first)?;
        let event: serde_json::Value = serde_json::from_str(&first)?;
        assert_eq!(event["event"], "run_started");
        let run = event["run_id"].as_str().ok_or("missing run ID")?.to_owned();
        if let Some(previous) = &retained_run {
            assert_eq!(previous, &run);
        }
        retained_run = Some(run.clone());
        ready_rx.recv_timeout(TIMEOUT)?;
        let pause = Command::new(env!("CARGO_BIN_EXE_auralis-translation-cli"))
            .args(["--json", "pause"])
            .arg(&state)
            .arg(&run)
            .output()?;
        assert!(pause.status.success());
        let started = Instant::now();
        let exit = loop {
            if let Some(exit) = child.try_wait()? {
                break exit;
            }
            if started.elapsed() >= TIMEOUT {
                return Err("CLI preflight did not stop".into());
            }
            std::thread::sleep(Duration::from_millis(10));
        };
        assert_eq!(exit.code(), Some(5));
        let mut terminal = String::new();
        reader.read_to_string(&mut terminal)?;
        let events = terminal
            .lines()
            .map(serde_json::from_str)
            .collect::<Result<Vec<serde_json::Value>, _>>()?;
        let failure = events.last().ok_or("missing terminal event")?;
        assert_eq!(failure["event"], "failed");
        assert_eq!(failure["code"], "paused");
        assert_eq!(failure["run_id"], run);
        assert!(!events.iter().any(|event| event["event"] == "result"));
        server.join().map_err(|_| "server panicked")??;
        let db = TranslateDb::open(
            &state.join("auralis-translate.sqlite"),
            SqliteConfig::default(),
        )?;
        let run_id = RunId::parse(&run)?;
        assert_eq!(db.run_state(run_id)?, RunState::Paused);
        assert!(db.checkpoints(run_id)?.is_empty());
        let raw = rusqlite::Connection::open(state.join("auralis-translate.sqlite"))?;
        let attempts: i64 =
            raw.query_row("SELECT COUNT(*) FROM run_attempts", [], |row| row.get(0))?;
        let results: i64 = raw.query_row("SELECT COUNT(*) FROM results", [], |row| row.get(0))?;
        assert_eq!((attempts, results), (0, 0));
        assert!(!output.exists());
        assert_eq!(std::fs::read(&source)?, SOURCE);
    }
    Ok(())
}
