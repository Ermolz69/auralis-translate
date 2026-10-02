#[path = "support/machine_workspace.rs"]
mod machine_workspace;

use auralis_translation::SourceHash;
use std::error::Error;
use std::process::Command;

const PROFILE: &[u8] =
    include_bytes!("../../../models/manifests/hy_mt2_1_8b_q4_k_m.context_v5.experimental.json");
const V6_PROFILE: &[u8] = include_bytes!(
    "../../../models/manifests/hy_mt2_1_8b_q4_k_m.context_v6_slot.experimental.json"
);
const V7_PROFILE: &[u8] = include_bytes!(
    "../../../models/manifests/hy_mt2_1_8b_q4_k_m.context_v7_batch4.experimental.json"
);
const V8_PROFILE: &[u8] = include_bytes!(
    "../../../models/manifests/hy_mt2_1_8b_q4_k_m.context_v8_target_first_batch4.experimental.json"
);

#[test]
fn v8_scene_run_preserves_source_and_rejects_v7_resume() -> Result<(), Box<dyn Error>> {
    let workspace = machine_workspace::MachineWorkspace::new()?;
    let source = workspace.0.join("source.srt");
    let profile = workspace.0.join("v8-profile.json");
    let old_profile = workspace.0.join("v7-profile.json");
    let scene = workspace.0.join("scene.json");
    let state = workspace.0.join("state");
    let output = workspace.0.join("result.srt");
    let original = "1\n00:00:01,000 --> 00:00:02,000\n王经理说，明天不是星期五。\n";
    std::fs::write(&source, original)?;
    std::fs::write(&profile, V8_PROFILE)?;
    std::fs::write(&old_profile, V7_PROFILE)?;
    std::fs::write(
        &scene,
        serde_json::to_vec(&serde_json::json!({
            "schema_version": 1,
            "source_sha256": SourceHash::digest(original.as_bytes()).to_string(),
            "evidence_id": "authored-v8-target-first-scene",
            "scene_end_ids": [1]
        }))?,
    )?;
    let started = Command::new(env!("CARGO_BIN_EXE_auralis-translation-cli"))
        .args([
            "translate-v5-scene",
            source.to_str().ok_or("source path")?,
            state.to_str().ok_or("state path")?,
            profile.to_str().ok_or("profile path")?,
            scene.to_str().ok_or("scene path")?,
            "http://127.0.0.1:1/",
            output.to_str().ok_or("output path")?,
        ])
        .output()?;
    assert!(!started.status.success());
    let stdout = String::from_utf8(started.stdout)?;
    let run_id = stdout
        .split_whitespace()
        .find_map(|item| item.strip_prefix("run_id="))
        .ok_or("missing v8 run ID")?;
    assert_eq!(std::fs::read(&source)?, original.as_bytes());
    assert!(!output.exists());
    let db = auralis_translation_sqlite::TranslateDb::open(
        &state.join("auralis-translate.sqlite"),
        auralis_translation_sqlite::SqliteConfig::default(),
    )?;
    let run = db.run(auralis_translation::RunId::parse(run_id)?)?;
    assert_eq!(run.blocks.len(), 1);
    assert_eq!(run.blocks[0].len(), 1);
    drop(db);
    let rejected = Command::new(env!("CARGO_BIN_EXE_auralis-translation-cli"))
        .args([
            "resume",
            state.to_str().ok_or("state path")?,
            run_id,
            old_profile.to_str().ok_or("v7 profile path")?,
            "http://127.0.0.1:1/",
            output.to_str().ok_or("output path")?,
        ])
        .output()?;
    assert!(!rejected.status.success());
    assert!(String::from_utf8_lossy(&rejected.stderr).contains("profile differs"));
    assert!(!output.exists());
    Ok(())
}

#[test]
fn v7_scene_run_freezes_four_target_plan_and_rejects_v6_resume() -> Result<(), Box<dyn Error>> {
    let workspace = machine_workspace::MachineWorkspace::new()?;
    let source = workspace.0.join("source.srt");
    let profile = workspace.0.join("v7-profile.json");
    let old_profile = workspace.0.join("v6-profile.json");
    let scene = workspace.0.join("scene.json");
    let state = workspace.0.join("state");
    let output = workspace.0.join("result.srt");
    let original = "1\n00:00:01,000 --> 00:00:02,000\n你好。\n\n2\n00:00:02,000 --> 00:00:03,000\n谢谢。\n\n3\n00:00:03,000 --> 00:00:04,000\n再见。\n\n4\n00:00:04,000 --> 00:00:05,000\n明天见。\n";
    std::fs::write(&source, original)?;
    std::fs::write(&profile, V7_PROFILE)?;
    std::fs::write(&old_profile, V6_PROFILE)?;
    std::fs::write(
        &scene,
        serde_json::to_vec(&serde_json::json!({
            "schema_version": 1,
            "source_sha256": SourceHash::digest(original.as_bytes()).to_string(),
            "evidence_id": "authored-v7-batch-scene",
            "scene_end_ids": [4]
        }))?,
    )?;
    let started = Command::new(env!("CARGO_BIN_EXE_auralis-translation-cli"))
        .args([
            "translate-v5-scene",
            source.to_str().ok_or("source path")?,
            state.to_str().ok_or("state path")?,
            profile.to_str().ok_or("profile path")?,
            scene.to_str().ok_or("scene path")?,
            "http://127.0.0.1:1/",
            output.to_str().ok_or("output path")?,
        ])
        .output()?;
    assert!(!started.status.success());
    let stdout = String::from_utf8(started.stdout)?;
    let run_id = stdout
        .split_whitespace()
        .find_map(|item| item.strip_prefix("run_id="))
        .ok_or("missing v7 run ID")?;
    assert_eq!(std::fs::read(&source)?, original.as_bytes());
    assert!(!output.exists());
    let db = auralis_translation_sqlite::TranslateDb::open(
        &state.join("auralis-translate.sqlite"),
        auralis_translation_sqlite::SqliteConfig::default(),
    )?;
    let run = db.run(auralis_translation::RunId::parse(run_id)?)?;
    assert_eq!(run.blocks.len(), 1);
    assert_eq!(run.blocks[0].len(), 4);
    drop(db);
    let rejected = Command::new(env!("CARGO_BIN_EXE_auralis-translation-cli"))
        .args([
            "resume",
            state.to_str().ok_or("state path")?,
            run_id,
            old_profile.to_str().ok_or("v6 profile path")?,
            "http://127.0.0.1:1/",
            output.to_str().ok_or("output path")?,
        ])
        .output()?;
    assert!(!rejected.status.success());
    assert!(String::from_utf8_lossy(&rejected.stderr).contains("profile differs"));
    assert!(!output.exists());
    Ok(())
}

#[test]
fn v6_scene_run_preserves_source_and_refuses_v5_resume() -> Result<(), Box<dyn Error>> {
    let workspace = machine_workspace::MachineWorkspace::new()?;
    let source = workspace.0.join("source.srt");
    let profile = workspace.0.join("v6-profile.json");
    let old_profile = workspace.0.join("v5-profile.json");
    let scene = workspace.0.join("scene.json");
    let state = workspace.0.join("state");
    let output = workspace.0.join("result.srt");
    let original = "1\n00:00:01,000 --> 00:00:02,000\n这不是最后一班车。\n";
    std::fs::write(&source, original)?;
    std::fs::write(&profile, V6_PROFILE)?;
    std::fs::write(&old_profile, PROFILE)?;
    std::fs::write(
        &scene,
        serde_json::to_vec(&serde_json::json!({
            "schema_version": 1,
            "source_sha256": SourceHash::digest(original.as_bytes()).to_string(),
            "evidence_id": "authored-v6-test-scene",
            "scene_end_ids": [1]
        }))?,
    )?;
    let started = Command::new(env!("CARGO_BIN_EXE_auralis-translation-cli"))
        .args([
            "translate-v5-scene",
            source.to_str().ok_or("source path")?,
            state.to_str().ok_or("state path")?,
            profile.to_str().ok_or("profile path")?,
            scene.to_str().ok_or("scene path")?,
            "http://127.0.0.1:1/",
            output.to_str().ok_or("output path")?,
        ])
        .output()?;
    assert!(!started.status.success());
    let stdout = String::from_utf8(started.stdout)?;
    let run_id = stdout
        .split_whitespace()
        .find_map(|item| item.strip_prefix("run_id="))
        .ok_or("missing v6 run ID")?;
    assert_eq!(std::fs::read(&source)?, original.as_bytes());
    assert!(!output.exists());
    let rejected = Command::new(env!("CARGO_BIN_EXE_auralis-translation-cli"))
        .args([
            "resume",
            state.to_str().ok_or("state path")?,
            run_id,
            old_profile.to_str().ok_or("v5 profile path")?,
            "http://127.0.0.1:1/",
            output.to_str().ok_or("output path")?,
        ])
        .output()?;
    assert!(!rejected.status.success());
    assert!(String::from_utf8_lossy(&rejected.stderr).contains("profile differs"));
    assert!(!output.exists());
    Ok(())
}

#[test]
fn file_context_requires_scene_map_before_state_creation() -> Result<(), Box<dyn Error>> {
    let workspace = machine_workspace::MachineWorkspace::new()?;
    let source = workspace.0.join("source.srt");
    let profile = workspace.0.join("profile.json");
    let state = workspace.0.join("state");
    let output = workspace.0.join("result.srt");
    let original = b"1\n00:00:01,000 --> 00:00:02,000\n\xe4\xbd\xa0\xe5\xa5\xbd\xe3\x80\x82\n";
    std::fs::write(&source, original)?;
    let mut value: serde_json::Value = serde_json::from_slice(PROFILE)?;
    value["context_before_segments"] = 1.into();
    value["max_context_bytes"] = 4096.into();
    value["token_safety_margin_tokens"] = 64.into();
    std::fs::write(&profile, serde_json::to_vec(&value)?)?;
    let result = Command::new(env!("CARGO_BIN_EXE_auralis-translation-cli"))
        .args([
            "translate",
            source.to_str().ok_or("source path")?,
            state.to_str().ok_or("state path")?,
            profile.to_str().ok_or("profile path")?,
            "http://127.0.0.1:1/",
            output.to_str().ok_or("output path")?,
        ])
        .output()?;
    assert!(!result.status.success());
    assert!(
        String::from_utf8_lossy(&result.stderr).contains("requires an explicit scene map"),
        "{}",
        String::from_utf8_lossy(&result.stderr)
    );
    assert!(!state.exists());
    assert!(!output.exists());
    assert_eq!(std::fs::read(source)?, original);
    Ok(())
}

#[test]
fn scene_map_is_frozen_for_resume_and_rejects_changed_evidence() -> Result<(), Box<dyn Error>> {
    let workspace = machine_workspace::MachineWorkspace::new()?;
    let source = workspace.0.join("source.srt");
    let profile = workspace.0.join("profile.json");
    let scene = workspace.0.join("scene.json");
    let state = workspace.0.join("state");
    let output = workspace.0.join("result.srt");
    let original = "1\n00:00:01,000 --> 00:00:02,000\n你好。\n\n2\n00:00:02,000 --> 00:00:03,000\n谢谢。\n\n3\n00:00:03,000 --> 00:00:04,000\n再见。\n";
    std::fs::write(&source, original)?;
    let mut value: serde_json::Value = serde_json::from_slice(PROFILE)?;
    value["context_before_segments"] = 1.into();
    value["context_after_segments"] = 1.into();
    value["max_context_bytes"] = 4096.into();
    value["token_safety_margin_tokens"] = 64.into();
    std::fs::write(&profile, serde_json::to_vec(&value)?)?;
    let source_hash = SourceHash::digest(original.as_bytes());
    let bad = serde_json::json!({
        "schema_version": 1,
        "source_sha256": source_hash.to_string(),
        "evidence_id": "scene-review-001",
        "scene_end_ids": [1]
    });
    std::fs::write(&scene, serde_json::to_vec(&bad)?)?;
    let start = |state: &std::path::Path| {
        Command::new(env!("CARGO_BIN_EXE_auralis-translation-cli"))
            .arg("translate-v5-scene")
            .arg(&source)
            .arg(state)
            .arg(&profile)
            .arg(&scene)
            .arg("http://127.0.0.1:1/")
            .arg(&output)
            .output()
    };
    let rejected = start(&state)?;
    assert!(!rejected.status.success());
    assert!(!state.exists());
    let valid = serde_json::json!({
        "schema_version": 1,
        "source_sha256": source_hash.to_string(),
        "evidence_id": "scene-review-001",
        "scene_end_ids": [2, 3]
    });
    let saved = serde_json::to_vec(&valid)?;
    std::fs::write(&scene, &saved)?;
    let started = start(&state)?;
    assert!(!started.status.success());
    let stdout = String::from_utf8(started.stdout)?;
    let run_id = stdout
        .split_whitespace()
        .find_map(|item| item.strip_prefix("run_id="))
        .ok_or("missing run ID")?;
    let managed = state.join("scene-maps").join(format!("{run_id}.json"));
    assert_eq!(std::fs::read(&managed)?, saved);
    assert_eq!(std::fs::read(&source)?, original.as_bytes());
    std::fs::write(&scene, b"changed external file")?;
    let resumed = Command::new(env!("CARGO_BIN_EXE_auralis-translation-cli"))
        .args([
            "resume",
            state.to_str().ok_or("state path")?,
            run_id,
            profile.to_str().ok_or("profile path")?,
            "http://127.0.0.1:1/",
            output.to_str().ok_or("output path")?,
        ])
        .output()?;
    assert!(!resumed.status.success());
    assert!(!String::from_utf8_lossy(&resumed.stderr).contains("frozen run"));
    let mut changed = valid;
    changed["evidence_id"] = "scene-review-002".into();
    std::fs::write(&managed, serde_json::to_vec(&changed)?)?;
    let rejected_resume = Command::new(env!("CARGO_BIN_EXE_auralis-translation-cli"))
        .args([
            "resume",
            state.to_str().ok_or("state path")?,
            run_id,
            profile.to_str().ok_or("profile path")?,
            "http://127.0.0.1:1/",
            output.to_str().ok_or("output path")?,
        ])
        .output()?;
    assert!(!rejected_resume.status.success());
    assert!(String::from_utf8_lossy(&rejected_resume.stderr).contains("frozen run"));
    assert!(!output.exists());
    Ok(())
}
