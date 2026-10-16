use std::error::Error;
use std::fs;
use std::path::Path;
use std::process::{Command, Output};

fn run(args: &[&Path], command: &str) -> Result<Output, Box<dyn Error>> {
    let mut child = Command::new(env!("CARGO_BIN_EXE_auralis-translation-cli"));
    child.arg(command);
    for arg in args {
        child.arg(arg);
    }
    Ok(child.output()?)
}

fn run_jsonl(args: &[&Path], command: &str) -> Result<Output, Box<dyn Error>> {
    let mut child = Command::new(env!("CARGO_BIN_EXE_auralis-translation-cli"));
    child.arg("--jsonl").arg(command);
    for arg in args {
        child.arg(arg);
    }
    Ok(child.output()?)
}

#[test]
fn occupied_output_is_refused_before_model_start() -> Result<(), Box<dyn Error>> {
    let directory = tempfile::tempdir()?;
    let source = directory.path().join("source.srt");
    let state = directory.path().join("state");
    let output = directory.path().join("translated.srt");
    fs::write(&source, b"1\n00:00:00,000 --> 00:00:01,000\nHello\n")?;
    fs::write(&output, b"owned output")?;
    let missing = directory.path().join("missing");
    let zero = Path::new("0");
    let result = run(
        &[&source, &state, &missing, &missing, &missing, zero, &output],
        "translate-local",
    )?;
    assert!(!result.status.success());
    assert!(String::from_utf8_lossy(&result.stderr).contains("output already exists"));
    assert_eq!(fs::read(&output)?, b"owned output");
    assert!(!state.exists());
    Ok(())
}

#[test]
fn malformed_source_is_rejected_before_model_start() -> Result<(), Box<dyn Error>> {
    let directory = tempfile::tempdir()?;
    let source = directory.path().join("source.vtt");
    let state = directory.path().join("state");
    let output = directory.path().join("translated.vtt");
    fs::write(&source, b"not a WebVTT file")?;
    let missing = directory.path().join("missing");
    let zero = Path::new("0");
    let result = run(
        &[&source, &state, &missing, &missing, &missing, zero, &output],
        "translate-vtt-local",
    )?;
    assert!(!result.status.success());
    assert!(!state.exists());
    assert!(!output.exists());
    assert_eq!(fs::read(&source)?, b"not a WebVTT file");
    Ok(())
}

#[test]
fn mismatched_checked_model_is_refused_before_model_start() -> Result<(), Box<dyn Error>> {
    let directory = tempfile::tempdir()?;
    let source = directory.path().join("source.srt");
    let state = directory.path().join("state");
    let output = directory.path().join("translated.srt");
    let model = directory.path().join("model.gguf");
    fs::write(&source, "1\n00:00:00,000 --> 00:00:01,000\n你好。\n")?;
    fs::write(&model, b"wrong model")?;
    let profile = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../../models/manifests/hy_mt2_1_8b_q4_k_m.checked.experimental.json");
    let executable = Path::new(env!("CARGO_BIN_EXE_auralis-translation-cli"));
    let zero = Path::new("0");
    let result = run_jsonl(
        &[&source, &state, &profile, executable, &model, zero, &output],
        "translate-local",
    )?;
    assert!(!result.status.success());
    assert_eq!(result.status.code(), Some(7));
    assert!(String::from_utf8_lossy(&result.stderr).contains("local model bytes differ"));
    let failure: serde_json::Value = serde_json::from_slice(&result.stdout)?;
    assert_eq!(failure["event"], "failed");
    assert_eq!(failure["code"], "model_mismatch");
    assert!(!state.exists());
    assert!(!output.exists());
    Ok(())
}

#[test]
fn opt_in_timing_stays_on_stderr_and_does_not_change_failure_event() -> Result<(), Box<dyn Error>> {
    let directory = tempfile::tempdir()?;
    let source = directory.path().join("source.srt");
    let state = directory.path().join("state");
    let output = directory.path().join("translated.srt");
    let model = directory.path().join("model.gguf");
    fs::write(&source, "1\n00:00:00,000 --> 00:00:01,000\n秘密文本。\n")?;
    fs::write(&model, b"wrong model")?;
    let profile = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../../models/manifests/hy_mt2_1_8b_q4_k_m.checked.experimental.json");
    let executable = Path::new(env!("CARGO_BIN_EXE_auralis-translation-cli"));
    let mut command = Command::new(executable);
    let timed = command
        .env("AURALIS_EVAL_TIMINGS", "1")
        .arg("--jsonl")
        .arg("translate-local")
        .args([
            &source,
            &state,
            &profile,
            executable,
            &model,
            Path::new("0"),
            &output,
        ])
        .output()?;
    assert_eq!(timed.status.code(), Some(7));
    let event: serde_json::Value = serde_json::from_slice(&timed.stdout)?;
    assert_eq!(event["event"], "failed");
    assert_eq!(event["code"], "model_mismatch");
    let stderr = String::from_utf8(timed.stderr)?;
    let records = stderr
        .lines()
        .filter_map(|line| line.strip_prefix("auralis_eval_timing "))
        .map(serde_json::from_str::<serde_json::Value>)
        .collect::<Result<Vec<_>, _>>()?;
    assert_eq!(records.len(), 2);
    assert_eq!(records[0]["phase"], "source_inspect");
    assert_eq!(records[1]["phase"], "prelaunch_model_hash");
    assert!(
        records
            .iter()
            .all(|row| row["elapsed_us"].as_u64().is_some())
    );
    assert!(!stderr.contains("秘密文本"));

    let untimed = run_jsonl(
        &[
            &source,
            &state,
            &profile,
            executable,
            &model,
            Path::new("0"),
            &output,
        ],
        "translate-local",
    )?;
    assert_eq!(untimed.status.code(), Some(7));
    assert_eq!(untimed.stdout, timed.stdout);
    assert!(!String::from_utf8_lossy(&untimed.stderr).contains("auralis_eval_timing "));
    Ok(())
}
