use serde_json::Value;
use std::{
    error::Error,
    ffi::OsString,
    path::Path,
    process::{Command, Output},
};

pub fn invoke_request(request: &Value, path: &Path, mode: &str) -> Result<Output, Box<dyn Error>> {
    std::fs::write(path, serde_json::to_vec(request)?)?;
    invoke(&[mode.into(), "--request".into(), path.into()])
}

pub fn invoke(args: &[OsString]) -> Result<Output, Box<dyn Error>> {
    Ok(Command::new(env!("CARGO_BIN_EXE_auralis-translation-cli"))
        .args(args)
        .output()?)
}

pub fn events(output: &Output) -> Result<Vec<Value>, Box<dyn Error>> {
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
    assert!(matches!(
        events.last().and_then(|event| event["event"].as_str()),
        Some("completed" | "failed")
    ));
    assert!(!events.iter().any(|event| matches!(
        event["event"].as_str(),
        Some("run_started" | "model_ready" | "result" | "progress")
    )));
    Ok(events)
}

pub fn failure(output: &Output, exit: i32, code: &str) -> Result<Vec<Value>, Box<dyn Error>> {
    assert_eq!(
        output.status.code(),
        Some(exit),
        "{}",
        String::from_utf8_lossy(&output.stderr)
    );
    let events = events(output)?;
    let terminal = events.last().ok_or("missing terminal")?;
    assert_eq!(terminal["event"], "failed");
    assert_eq!(terminal["code"], code);
    assert!(terminal["translation_id"].is_null());
    assert!(terminal["run_id"].is_null());
    assert!(
        !events
            .iter()
            .any(|event| event["event"] == "package_installed")
    );
    Ok(events)
}
