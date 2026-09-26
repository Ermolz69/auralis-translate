#[path = "support/cli_child.rs"]
mod cli_child;
#[path = "support/machine_server.rs"]
mod machine_server;
#[path = "support/machine_workspace.rs"]
mod machine_workspace;

use auralis_translation::{RunId, RunState, SourceHash};
use auralis_translation_sqlite::{SqliteConfig, TranslateDb};
use machine_workspace::MachineWorkspace;
use serde_json::{Value, json};
use std::{
    error::Error,
    io::{BufRead, BufReader},
    net::TcpListener,
    path::Path,
    process::{Command, Output, Stdio},
    time::{Duration, Instant},
};

const PROFILE: &[u8] =
    include_bytes!("../../../models/manifests/hy_mt2_1_8b_q4_k_m.experimental.json");
const SOURCE: &str = "\u{feff}1\r\n00:00:01,000 --> 00:00:03,000\r\n你好。\r\n";

fn invoke(args: &[&str]) -> Result<Output, Box<dyn Error>> {
    Ok(Command::new(env!("CARGO_BIN_EXE_auralis-translation-cli"))
        .args(args)
        .output()?)
}
fn text(path: &Path) -> Result<&str, Box<dyn Error>> {
    Ok(path.to_str().ok_or("test path is not Unicode")?)
}
fn lines(output: &Output) -> Result<Vec<Value>, Box<dyn Error>> {
    let events = std::str::from_utf8(&output.stdout)?
        .lines()
        .map(serde_json::from_str)
        .collect::<Result<Vec<Value>, _>>()?;
    for (index, event) in events.iter().enumerate() {
        assert_eq!(event["schema_version"], 1);
        assert_eq!(event["sequence"], index + 1);
    }
    assert_eq!(
        events
            .iter()
            .filter(|event| matches!(event["event"].as_str(), Some("completed" | "failed")))
            .count(),
        1
    );
    Ok(events)
}

#[test]
fn json_request_inspects_unicode_without_mixing_text_and_rejects_bad_requests()
-> Result<(), Box<dyn Error>> {
    let directory = MachineWorkspace::new()?;
    let source = directory.0.join("原文 with spaces.srt");
    let request = directory.0.join("request.json");
    std::fs::write(&source, SOURCE)?;
    let valid = json!({"schema_version": 1, "request": {"command": "inspect", "source": source}});
    std::fs::write(&request, serde_json::to_vec(&valid)?)?;
    let output = invoke(&["--json", "--request", text(&request)?])?;
    assert_eq!(output.status.code(), Some(0));
    let report: Value = serde_json::from_slice(&output.stdout)?;
    assert_eq!(report["command"], "inspect");
    assert_eq!(report["report"]["report"]["segments"][0]["cue_id"], "1");
    assert_eq!(
        report["report"]["report"]["segments"][0]["text_slots"][0]["text"],
        "你好。"
    );
    assert_eq!(report["terminal"]["event"], "completed");
    for invalid in [
        json!({"schema_version": 2, "request": valid["request"]}),
        json!({"schema_version": 1, "request": {"command": "inspect", "source": source, "unexpected": true}}),
    ] {
        std::fs::write(&request, serde_json::to_vec(&invalid)?)?;
        let output = invoke(&["--jsonl", "--request", text(&request)?])?;
        assert_eq!(output.status.code(), Some(2));
        assert_eq!(lines(&output)?[0]["code"], "invalid_input");
    }
    std::fs::write(&request, vec![b' '; 1024 * 1024 + 1])?;
    let oversized = invoke(&["--jsonl", "--request", text(&request)?])?;
    assert_eq!(oversized.status.code(), Some(2));
    assert_eq!(lines(&oversized)?[0]["code"], "invalid_input");
    let unknown = invoke(&["--jsonl", "install-online"])?;
    assert_eq!(unknown.status.code(), Some(2));
    assert_eq!(lines(&unknown)?[0]["code"], "usage");
    Ok(())
}

#[test]
fn machine_translate_and_offline_export_preserve_both_formats_and_review_exit()
-> Result<(), Box<dyn Error>> {
    for format in ["srt", "vtt"] {
        let directory = MachineWorkspace::new()?;
        let source = directory.0.join(format!("source.{format}"));
        let state = directory.0.join("state");
        let profile = directory.0.join("profile.json");
        let output_path = directory.0.join(format!("translated.{format}"));
        let source_text = if format == "srt" {
            SOURCE.into()
        } else {
            SOURCE
                .replace("\u{feff}1\r\n", "\u{feff}WEBVTT\r\n\r\n")
                .replace(',', ".")
        };
        std::fs::write(&source, &source_text)?;
        std::fs::write(&profile, PROFILE)?;
        let listener = TcpListener::bind("127.0.0.1:0")?;
        let endpoint = format!("http://{}/", listener.local_addr()?);
        let server = std::thread::spawn(move || machine_server::serve(listener, 1, None));
        let output = invoke(&[
            "--jsonl",
            if format == "srt" {
                "translate"
            } else {
                "translate-vtt"
            },
            text(&source)?,
            text(&state)?,
            text(&profile)?,
            &endpoint,
            text(&output_path)?,
        ])?;
        server.join().map_err(|_| "server panicked")??;
        assert_eq!(
            output.status.code(),
            Some(3),
            "{}",
            String::from_utf8_lossy(&output.stderr)
        );
        let events = lines(&output)?;
        assert_eq!(events[0]["event"], "run_started");
        assert!(events.iter().any(|event| event["event"] == "progress"
            && event["saved_blocks"] == 1
            && event["total_blocks"] == 1));
        let result = events
            .iter()
            .find(|event| event["event"] == "result")
            .ok_or("missing result")?;
        let bytes = std::fs::read(&output_path)?;
        assert_eq!(
            result["output_sha256"],
            SourceHash::digest(&bytes).to_string()
        );
        assert_eq!(result["output_bytes"], bytes.len());
        assert_eq!(result["review_state"], "needs_review");
        assert_eq!(events.last().ok_or("missing terminal")?["exit_code"], 3);
        let run_id = events[0]["run_id"].as_str().ok_or("missing run ID")?;
        let status = invoke(&["--json", "status", text(&state)?, run_id])?;
        assert_eq!(status.status.code(), Some(0));
        let status: Value = serde_json::from_slice(&status.stdout)?;
        assert_eq!(status["report"]["report"]["state"], "validated");
        assert_eq!(
            status["report"]["report"]["selected_result_id"],
            result["result_id"]
        );
        let reexport = directory.0.join(format!("reexport.{format}"));
        let exported = invoke(&[
            "--json",
            "resume",
            text(&state)?,
            run_id,
            text(&profile)?,
            "http://127.0.0.1:1/",
            text(&reexport)?,
        ])?;
        assert_eq!(exported.status.code(), Some(3));
        let exported: Value = serde_json::from_slice(&exported.stdout)?;
        assert_eq!(exported["result"]["result_id"], result["result_id"]);
        assert!(exported["model"].is_null());
        assert_eq!(std::fs::read(&reexport)?, bytes);
        assert_eq!(std::fs::read_to_string(&source)?, source_text);
        let conflict = invoke(&[
            "--jsonl",
            "resume",
            text(&state)?,
            run_id,
            text(&profile)?,
            "http://127.0.0.1:1/",
            text(&reexport)?,
        ])?;
        assert_eq!(conflict.status.code(), Some(7));
        assert_eq!(
            lines(&conflict)?.last().ok_or("missing conflict")?["code"],
            "conflict"
        );
    }
    Ok(())
}

#[test]
fn failures_have_typed_codes_and_retain_registered_run_ids() -> Result<(), Box<dyn Error>> {
    let directory = MachineWorkspace::new()?;
    let source = directory.0.join("source.srt");
    let profile = directory.0.join("profile.json");
    let state = directory.0.join("state");
    let result = directory.0.join("result.srt");
    std::fs::write(&source, SOURCE.replace("你好。", "<i>bad</i>"))?;
    std::fs::write(&profile, PROFILE)?;
    let args = [
        "--jsonl",
        "translate",
        text(&source)?,
        text(&state)?,
        text(&profile)?,
        "http://127.0.0.1:1/",
        text(&result)?,
    ];
    let invalid = invoke(&args)?;
    assert_eq!(invalid.status.code(), Some(2));
    assert_eq!(lines(&invalid)?[0]["code"], "invalid_source");
    assert!(!state.exists());
    std::fs::write(&source, SOURCE)?;
    let failed = invoke(&args)?;
    assert_eq!(failed.status.code(), Some(4));
    let events = lines(&failed)?;
    assert_eq!(events[0]["event"], "run_started");
    let terminal = events.last().ok_or("missing failure")?;
    assert_eq!(terminal["code"], "runtime_failure");
    assert_eq!(terminal["run_id"], events[0]["run_id"]);
    let run_id = RunId::parse(terminal["run_id"].as_str().ok_or("missing run")?)?;
    let db = TranslateDb::open(
        &state.join("auralis-translate.sqlite"),
        SqliteConfig::default(),
    )?;
    assert_eq!(db.run_state(run_id)?, RunState::Failed);
    assert!(!result.exists());
    Ok(())
}

#[test]
fn export_failure_keeps_validated_result_for_offline_resume_and_json_edit()
-> Result<(), Box<dyn Error>> {
    let directory = MachineWorkspace::new()?;
    let source = directory.0.join("source.srt");
    let profile = directory.0.join("profile.json");
    let state = directory.0.join("state");
    let missing_parent = directory.0.join("missing/result.srt");
    std::fs::write(&source, SOURCE)?;
    std::fs::write(&profile, PROFILE)?;
    let listener = TcpListener::bind("127.0.0.1:0")?;
    let endpoint = format!("http://{}/", listener.local_addr()?);
    let server = std::thread::spawn(move || machine_server::serve(listener, 1, None));
    let output = invoke(&[
        "--jsonl",
        "translate",
        text(&source)?,
        text(&state)?,
        text(&profile)?,
        &endpoint,
        text(&missing_parent)?,
    ])?;
    server.join().map_err(|_| "model server panicked")??;
    assert_eq!(output.status.code(), Some(6));
    let events = lines(&output)?;
    assert!(!events.iter().any(|event| event["event"] == "result"));
    assert_eq!(
        events.last().ok_or("missing terminal")?["code"],
        "io_failure"
    );
    let run_id = events[0]["run_id"].as_str().ok_or("missing run")?;
    let db = TranslateDb::open(
        &state.join("auralis-translate.sqlite"),
        SqliteConfig::default(),
    )?;
    assert_eq!(db.run_state(RunId::parse(run_id)?)?, RunState::Validated);
    let original_result = db.result_for_run(RunId::parse(run_id)?)?;
    drop(db);
    let export = directory.0.join("export.srt");
    let exported = invoke(&[
        "--json",
        "resume",
        text(&state)?,
        run_id,
        text(&profile)?,
        "http://127.0.0.1:1/",
        text(&export)?,
    ])?;
    assert_eq!(exported.status.code(), Some(3));
    let exported: Value = serde_json::from_slice(&exported.stdout)?;
    assert_eq!(
        exported["result"]["result_id"],
        original_result.result_id.to_string()
    );
    let original_bytes = std::fs::read(&export)?;
    let diagnostics = invoke(&["--jsonl", "diagnostics", text(&state)?, run_id])?;
    assert_eq!(diagnostics.status.code(), Some(0));
    assert_eq!(lines(&diagnostics)?[0]["report"]["run_id"], run_id);
    let edit = directory.0.join("edit.json");
    let revised_path = directory.0.join("revised.srt");
    std::fs::write(
        &edit,
        serde_json::to_vec(
            &json!({"schema_version": 1, "segment_id": 1, "lines": ["Здравствуйте."]}),
        )?,
    )?;
    let revised = invoke(&[
        "--json",
        "edit",
        text(&state)?,
        &original_result.result_id.to_string(),
        text(&profile)?,
        text(&edit)?,
        text(&revised_path)?,
    ])?;
    assert_eq!(revised.status.code(), Some(3));
    let revised: Value = serde_json::from_slice(&revised.stdout)?;
    assert_eq!(revised["result"]["revision"], 2);
    assert_ne!(
        revised["result"]["result_id"],
        original_result.result_id.to_string()
    );
    assert!(std::fs::read_to_string(&revised_path)?.contains("Здравствуйте."));
    assert_eq!(std::fs::read(&export)?, original_bytes);
    assert_eq!(std::fs::read_to_string(&source)?, SOURCE);
    let failed_edit_path = directory.0.join("missing/edit.srt");
    std::fs::write(
        &edit,
        serde_json::to_vec(&json!({"schema_version":1,"segment_id":1,"lines":["Добрый день."]}))?,
    )?;
    let failed_edit = invoke(&[
        "--jsonl",
        "edit",
        text(&state)?,
        revised["result"]["result_id"]
            .as_str()
            .ok_or("missing revised ID")?,
        text(&profile)?,
        text(&edit)?,
        text(&failed_edit_path)?,
    ])?;
    assert_eq!(failed_edit.status.code(), Some(6));
    let failed_edit = lines(&failed_edit)?;
    assert_eq!(failed_edit[0]["event"], "run_started");
    assert_eq!(
        failed_edit.last().ok_or("missing edit failure")?["run_id"],
        run_id
    );
    assert!(!failed_edit_path.exists());
    let latest = directory.0.join("latest.srt");
    let latest_export = invoke(&[
        "--json",
        "resume",
        text(&state)?,
        run_id,
        text(&profile)?,
        "http://127.0.0.1:1/",
        text(&latest)?,
    ])?;
    assert_eq!(latest_export.status.code(), Some(3));
    let latest_export: Value = serde_json::from_slice(&latest_export.stdout)?;
    assert_eq!(latest_export["result"]["revision"], 3);
    assert!(std::fs::read_to_string(latest)?.contains("Добрый день."));
    let stale = invoke(&[
        "--jsonl",
        "edit",
        text(&state)?,
        &original_result.result_id.to_string(),
        text(&profile)?,
        text(&edit)?,
        text(&directory.0.join("stale.srt"))?,
    ])?;
    assert_eq!(stale.status.code(), Some(7));
    assert_eq!(
        lines(&stale)?.last().ok_or("missing stale conflict")?["code"],
        "conflict"
    );
    Ok(())
}

#[test]
fn doctor_reports_verified_identity_and_typed_model_mismatch() -> Result<(), Box<dyn Error>> {
    let directory = MachineWorkspace::new()?;
    let model = directory.0.join("fixture.gguf");
    let profile = directory.0.join("profile.json");
    let bytes = b"doctor fixture only; not valid model weights";
    std::fs::write(&model, bytes)?;
    let mut manifest: Value = serde_json::from_slice(PROFILE)?;
    manifest["model_file_sha256"] = json!(SourceHash::digest(bytes).to_string());
    std::fs::write(&profile, serde_json::to_vec(&manifest)?)?;
    let checked = invoke(&["--jsonl", "doctor", text(&profile)?, text(&model)?])?;
    assert_eq!(checked.status.code(), Some(0));
    let checked = lines(&checked)?;
    assert_eq!(checked[0]["report"]["verified"], true);
    assert_eq!(checked[0]["report"]["model_bytes"], bytes.len());
    std::fs::write(&model, b"changed")?;
    let mismatch = invoke(&["--jsonl", "doctor", text(&profile)?, text(&model)?])?;
    assert_eq!(mismatch.status.code(), Some(7));
    assert_eq!(lines(&mismatch)?[0]["code"], "model_mismatch");
    Ok(())
}

#[test]
fn named_translation_request_freezes_glossary_and_exposes_advisory_diagnostic()
-> Result<(), Box<dyn Error>> {
    let directory = MachineWorkspace::new()?;
    let source = directory.0.join("source.srt");
    let profile = directory.0.join("profile.json");
    let glossary = directory.0.join("glossary.json");
    let request = directory.0.join("request.json");
    let output_path = directory.0.join("result.srt");
    let state = directory.0.join("state");
    std::fs::write(&source, SOURCE)?;
    std::fs::write(
        &profile,
        include_bytes!("../../../models/manifests/hy_mt2_1_8b_q4_k_m.glossary.experimental.json"),
    )?;
    std::fs::write(
        &glossary,
        serde_json::to_vec(
            &json!({"schema_version":1, "entries":[{"source":"你好", "target":"Здравствуйте"}]}),
        )?,
    )?;
    let listener = TcpListener::bind("127.0.0.1:0")?;
    let endpoint = format!("http://{}/", listener.local_addr()?);
    let server = std::thread::spawn(move || machine_server::serve(listener, 1, None));
    std::fs::write(
        &request,
        serde_json::to_vec(
            &json!({"schema_version":1,"request":{"command":"translate-glossary","source":source,"profile":profile,"state_dir":state,"glossary":glossary,"endpoint":endpoint,"output":output_path}}),
        )?,
    )?;
    let translated = invoke(&["--jsonl", "--request", text(&request)?])?;
    server.join().map_err(|_| "glossary server panicked")??;
    assert_eq!(translated.status.code(), Some(3));
    let translated = lines(&translated)?;
    let run_id = translated[0]["run_id"].as_str().ok_or("missing run")?;
    let diagnostics = invoke(&["--json", "diagnostics", text(&state)?, run_id])?;
    assert_eq!(diagnostics.status.code(), Some(0));
    let diagnostics: Value = serde_json::from_slice(&diagnostics.stdout)?;
    assert_eq!(
        diagnostics["report"]["report"]["warnings"][0]["code"],
        "glossary_term_missing"
    );
    let db = TranslateDb::open(
        &state.join("auralis-translate.sqlite"),
        SqliteConfig::default(),
    )?;
    assert!(db.run(RunId::parse(run_id)?)?.glossary_revision.is_some());
    assert_eq!(std::fs::read_to_string(source)?, SOURCE);
    Ok(())
}

#[test]
fn jsonl_pause_is_flushed_mid_request_and_resume_retains_checkpoint() -> Result<(), Box<dyn Error>>
{
    let directory = MachineWorkspace::new()?;
    let source = directory.0.join("source.srt");
    let source_text = (1..=9)
        .map(|id| {
            format!(
                "{id}\n00:00:{id:02},000 --> 00:00:{:02},000\n你好。\n\n",
                id + 1
            )
        })
        .collect::<String>();
    let profile = directory.0.join("profile.json");
    let state = directory.0.join("state");
    let result = directory.0.join("result.srt");
    std::fs::write(&source, &source_text)?;
    std::fs::write(&profile, PROFILE)?;
    let listener = TcpListener::bind("127.0.0.1:0")?;
    let endpoint = format!("http://{}/", listener.local_addr()?);
    let (ready_tx, ready_rx) = std::sync::mpsc::channel();
    let server = std::thread::spawn(move || machine_server::serve(listener, 9, Some(ready_tx)));
    let mut child = cli_child::CliChild(
        Command::new(env!("CARGO_BIN_EXE_auralis-translation-cli"))
            .args([
                "--jsonl",
                "translate",
                text(&source)?,
                text(&state)?,
                text(&profile)?,
                &endpoint,
                text(&result)?,
            ])
            .stdout(Stdio::piped())
            .stderr(Stdio::null())
            .spawn()?,
    );
    let mut stdout = BufReader::new(child.stdout.take().ok_or("missing stdout")?);
    let mut first = String::new();
    stdout.read_line(&mut first)?;
    let first: Value = serde_json::from_str(&first)?;
    assert_eq!(first["event"], "run_started");
    let run_id = first["run_id"].as_str().ok_or("missing run ID")?;
    ready_rx.recv_timeout(Duration::from_secs(10))?;
    let db = TranslateDb::open(
        &state.join("auralis-translate.sqlite"),
        SqliteConfig::default(),
    )?;
    let checkpoint = db.checkpoints(RunId::parse(run_id)?)?;
    assert_eq!(checkpoint.len(), 1);
    drop(db);
    let paused = invoke(&["--jsonl", "pause", text(&state)?, run_id])?;
    assert_eq!(paused.status.code(), Some(0));
    assert_eq!(lines(&paused)?[0]["event"], "pause_requested");
    let deadline = Instant::now() + Duration::from_secs(5);
    let exit = loop {
        if let Some(exit) = child.try_wait()? {
            break exit;
        }
        if Instant::now() >= deadline {
            child.kill()?;
            return Err("machine pause did not finish".into());
        }
        std::thread::sleep(Duration::from_millis(10));
    };
    assert_eq!(exit.code(), Some(5));
    let mut events = vec![first.clone()];
    for line in stdout.lines() {
        events.push(serde_json::from_str(&line?)?);
    }
    for (index, event) in events.iter().enumerate() {
        assert_eq!(event["sequence"], index + 1);
    }
    assert_eq!(events.last().ok_or("missing terminal")?["code"], "paused");
    assert!(!events.iter().any(|event| event["event"] == "result"));
    assert!(!result.exists());
    server.join().map_err(|_| "pause server panicked")??;
    let listener = TcpListener::bind("127.0.0.1:0")?;
    let endpoint = format!("http://{}/", listener.local_addr()?);
    let server = std::thread::spawn(move || machine_server::serve(listener, 1, None));
    let resumed = invoke(&[
        "--jsonl",
        "resume",
        text(&state)?,
        run_id,
        text(&profile)?,
        &endpoint,
        text(&result)?,
    ])?;
    assert_eq!(resumed.status.code(), Some(3));
    server.join().map_err(|_| "resume server panicked")??;
    let db = TranslateDb::open(
        &state.join("auralis-translate.sqlite"),
        SqliteConfig::default(),
    )?;
    assert_eq!(db.checkpoints(RunId::parse(run_id)?)?[0], checkpoint[0]);
    assert_eq!(db.run_state(RunId::parse(run_id)?)?, RunState::Validated);
    assert_eq!(std::fs::read_to_string(source)?, source_text);
    Ok(())
}
