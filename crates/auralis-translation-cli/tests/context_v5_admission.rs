#[path = "support/machine_workspace.rs"]
mod machine_workspace;

use std::error::Error;
use std::process::Command;

const PROFILE: &[u8] =
    include_bytes!("../../../models/manifests/hy_mt2_1_8b_q4_k_m.context_v5.experimental.json");

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
