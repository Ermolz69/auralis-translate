#[path = "support/captured_writer.rs"]
mod captured_writer;

use auralis_translation::SourceHash;
use auralis_translation_llamacpp::{ModelProfile, ServerReport, verify_server_report_metadata};
use captured_writer::CapturedWriter;
use std::error::Error;

const CHECKED_PROFILE: &[u8] =
    include_bytes!("../../../models/manifests/hy_mt2_1_8b_q4_k_m.checked.experimental.json");

#[test]
fn readiness_metadata_is_checked_without_hashing_model_bytes() -> Result<(), Box<dyn Error>> {
    let directory = tempfile::tempdir()?;
    let model = directory.path().join("model.gguf");
    let original = b"checked model bytes";
    std::fs::write(&model, original)?;
    let mut manifest: serde_json::Value = serde_json::from_slice(CHECKED_PROFILE)?;
    manifest["model_file_sha256"] = serde_json::json!(SourceHash::digest(original).to_string());
    manifest["model_file_bytes"] = serde_json::json!(original.len());
    let profile = ModelProfile::from_json(&serde_json::to_vec(&manifest)?)?;
    let canonical = std::fs::canonicalize(&model)?;
    let report = ServerReport {
        model_path: canonical
            .to_str()
            .ok_or("model path is not Unicode")?
            .into(),
        model_alias: profile.model_alias.clone(),
        build_info: profile
            .runtime_build_info
            .clone()
            .ok_or("checked runtime build is missing")?,
        context_tokens: profile
            .min_context_tokens
            .ok_or("checked context is missing")?,
    };
    let capture = CapturedWriter::default();
    let writer = capture.clone();
    let subscriber = tracing_subscriber::fmt()
        .json()
        .without_time()
        .with_ansi(false)
        .with_writer(move || writer.clone())
        .finish();
    tracing::subscriber::with_default(subscriber, || -> Result<(), Box<dyn Error>> {
        assert_eq!(verify_server_report_metadata(&report, &profile)?, canonical);
        std::fs::write(&model, b"changed model bytes")?;
        assert_eq!(verify_server_report_metadata(&report, &profile)?, canonical);
        Ok(())
    })?;
    assert!(capture.records()?.is_empty());
    Ok(())
}

#[test]
fn readiness_rejects_wrong_server_identity_or_model_size() -> Result<(), Box<dyn Error>> {
    let directory = tempfile::tempdir()?;
    let model = directory.path().join("model.gguf");
    std::fs::write(&model, b"model")?;
    let mut manifest: serde_json::Value = serde_json::from_slice(CHECKED_PROFILE)?;
    manifest["model_file_sha256"] = serde_json::json!(SourceHash::digest(b"model").to_string());
    manifest["model_file_bytes"] = serde_json::json!(5);
    let profile = ModelProfile::from_json(&serde_json::to_vec(&manifest)?)?;
    let report = ServerReport {
        model_path: std::fs::canonicalize(&model)?
            .to_str()
            .ok_or("model path is not Unicode")?
            .into(),
        model_alias: profile.model_alias.clone(),
        build_info: profile
            .runtime_build_info
            .clone()
            .ok_or("checked runtime build is missing")?,
        context_tokens: profile
            .min_context_tokens
            .ok_or("checked context is missing")?,
    };
    let mut wrong = report.clone();
    wrong.model_alias = "wrong-alias".into();
    assert!(verify_server_report_metadata(&wrong, &profile).is_err());
    wrong = report.clone();
    wrong.build_info = "wrong-build".into();
    assert!(verify_server_report_metadata(&wrong, &profile).is_err());
    wrong = report.clone();
    wrong.context_tokens = report.context_tokens - 1;
    assert!(verify_server_report_metadata(&wrong, &profile).is_err());
    wrong = report.clone();
    wrong.model_path = "relative.gguf".into();
    assert!(verify_server_report_metadata(&wrong, &profile).is_err());
    std::fs::write(&model, b"longer")?;
    assert!(verify_server_report_metadata(&report, &profile).is_err());
    Ok(())
}
