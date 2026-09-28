#[path = "support/machine_workspace.rs"]
mod machine_workspace;

use auralis_translation::SourceHash;
use serde_json::{Value, json};
use std::{error::Error, path::Path, process::Command};

const PROFILE: &[u8] = include_bytes!(
    "../../../models/manifests/hy_mt2_1_8b_q4_k_m.context_v5_scene_terms.experimental.json"
);

fn start(
    source: &Path,
    state: &Path,
    profile: &Path,
    scene: &Path,
    terms: &Path,
    output: &Path,
) -> Result<std::process::Output, Box<dyn Error>> {
    Ok(Command::new(env!("CARGO_BIN_EXE_auralis-translation-cli"))
        .arg("translate-v5-scene-terms")
        .arg(source)
        .arg(state)
        .arg(profile)
        .arg(scene)
        .arg(terms)
        .arg("http://127.0.0.1:1/")
        .arg(output)
        .output()?)
}

#[test]
fn ledger_is_checked_before_state_and_frozen_for_resume() -> Result<(), Box<dyn Error>> {
    let workspace = machine_workspace::MachineWorkspace::new()?;
    let source = workspace.0.join("source.srt");
    let profile = workspace.0.join("profile.json");
    let scene = workspace.0.join("scene.json");
    let ledger = workspace.0.join("terms.json");
    let state = workspace.0.join("state");
    let output = workspace.0.join("result.srt");
    let original = "1\n00:00:01,000 --> 00:00:02,000\n小王来了。\n\n2\n00:00:02,000 --> 00:00:03,000\n她等着。\n";
    std::fs::write(&source, original)?;
    std::fs::write(&profile, PROFILE)?;
    let scene_payload = json!({"schema_version":1,"source_sha256":SourceHash::digest(original.as_bytes()).to_string(),"evidence_id":"authored-scene-001","scene_end_ids":[2]});
    let scene_bytes = serde_json::to_vec(&scene_payload)?;
    std::fs::write(&scene, &scene_bytes)?;
    let mut terms = json!({
        "schema_version":1,
        "source_sha256":SourceHash::digest(original.as_bytes()).to_string(),
        "scene_map_sha256":SourceHash::digest(&scene_bytes).to_string(),
        "terms":[{"source":"小王","target":"Сяо Ван","allowed_forms":[],"segment_ids":[2],"reviewer_id":"fixture-reviewer","evidence_id":"fixture-note"}]
    });
    std::fs::write(&ledger, serde_json::to_vec(&terms)?)?;
    let invalid = start(&source, &state, &profile, &scene, &ledger, &output)?;
    assert!(!invalid.status.success());
    assert!(!state.exists());
    terms["terms"][0]["segment_ids"] = json!([1]);
    let saved = serde_json::to_vec(&terms)?;
    std::fs::write(&ledger, &saved)?;
    let started = start(&source, &state, &profile, &scene, &ledger, &output)?;
    assert!(!started.status.success());
    let stdout = String::from_utf8(started.stdout)?;
    let run_id = stdout
        .split_whitespace()
        .find_map(|part| part.strip_prefix("run_id="))
        .ok_or("run id")?;
    let managed = state.join("terms-ledgers").join(format!("{run_id}.json"));
    assert_eq!(std::fs::read(&managed)?, saved);
    assert_eq!(std::fs::read(&source)?, original.as_bytes());
    std::fs::write(&ledger, b"external edit")?;
    let resume = || {
        Command::new(env!("CARGO_BIN_EXE_auralis-translation-cli"))
            .arg("resume")
            .arg(&state)
            .arg(run_id)
            .arg(&profile)
            .arg("http://127.0.0.1:1/")
            .arg(&output)
            .output()
    };
    let unchanged = resume()?;
    assert!(!unchanged.status.success());
    assert!(!String::from_utf8_lossy(&unchanged.stderr).contains("frozen terms ledger"));
    let mut changed: Value = serde_json::from_slice(&saved)?;
    changed["terms"][0]["reviewer_id"] = "tampered".into();
    std::fs::write(&managed, serde_json::to_vec(&changed)?)?;
    let rejected = resume()?;
    assert!(!rejected.status.success());
    assert!(
        String::from_utf8_lossy(&rejected.stderr)
            .contains("managed terms ledger differs from frozen run")
    );
    assert!(!output.exists());
    Ok(())
}
