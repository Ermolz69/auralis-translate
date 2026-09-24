use auralis_translation::SourceHash;
use std::error::Error;
use std::path::Path;
use std::process::Command;
use std::time::{SystemTime, UNIX_EPOCH};

const PROFILE: &[u8] =
    include_bytes!("../../../models/manifests/hy_mt2_1_8b_q4_k_m.experimental.json");

#[test]
fn doctor_verifies_model_file_without_loading_it_into_memory() -> Result<(), Box<dyn Error>> {
    let nonce = SystemTime::now().duration_since(UNIX_EPOCH)?.as_nanos();
    let directory =
        std::env::temp_dir().join(format!("auralis-doctor-{}-{nonce}", std::process::id()));
    std::fs::create_dir(&directory)?;
    let profile_path = directory.join("profile.json");
    let model_path = directory.join("weight.gguf");
    let model = b"synthetic test weight";
    std::fs::write(&model_path, model)?;
    let mut profile: serde_json::Value = serde_json::from_slice(PROFILE)?;
    profile["model_file_sha256"] = SourceHash::digest(model).to_string().into();
    std::fs::write(&profile_path, serde_json::to_vec(&profile)?)?;

    let report = command(&profile_path, &model_path)?;
    assert!(report.status.success());
    let json: serde_json::Value = serde_json::from_slice(&report.stdout)?;
    assert_eq!(json["model_bytes"], model.len());
    assert_eq!(json["model_sha256"], SourceHash::digest(model).to_string());
    assert_eq!(json["verified"], true);

    std::fs::write(&model_path, b"changed weight")?;
    let mismatch = command(&profile_path, &model_path)?;
    assert!(!mismatch.status.success());
    assert!(mismatch.stdout.is_empty());
    std::fs::remove_dir_all(directory)?;
    Ok(())
}

fn command(profile: &Path, model: &Path) -> Result<std::process::Output, Box<dyn Error>> {
    Ok(Command::new(env!("CARGO_BIN_EXE_auralis-translation-cli"))
        .arg("doctor")
        .arg(profile)
        .arg(model)
        .output()?)
}
