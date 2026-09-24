use crate::model_hash::hash_file;
use auralis_translation::SourceHash;
use auralis_translation_llamacpp::{LlamaCppProvider, ModelProfile};
use std::{error::Error, path::Path};

pub(crate) fn verify(
    provider: &LlamaCppProvider,
    profile: &ModelProfile,
) -> Result<(), Box<dyn Error>> {
    let Some(expected_bytes) = profile.model_file_bytes else {
        return Ok(());
    };
    let expected_build = profile
        .runtime_build_info
        .as_deref()
        .ok_or("profile runtime build is missing")?;
    let minimum_context = profile
        .min_context_tokens
        .ok_or("profile minimum context is missing")?;
    let report = provider.probe_server()?;
    if report.model_alias != profile.model_alias || report.build_info != expected_build {
        return Err("llama.cpp server model alias or runtime build differs from profile".into());
    }
    if report.context_tokens < minimum_context {
        return Err("llama.cpp server context is smaller than profile minimum".into());
    }
    let reported_path = Path::new(&report.model_path);
    if !reported_path.is_absolute() {
        return Err("llama.cpp server model path must be absolute for verification".into());
    }
    let model_path = std::fs::canonicalize(reported_path)?;
    if std::fs::metadata(&model_path)?.len() != expected_bytes {
        return Err("llama.cpp server model file size differs from profile".into());
    }
    let expected_hash = SourceHash::parse_hex(&profile.model_file_sha256)
        .ok_or("profile model SHA-256 is invalid")?;
    let (observed_hash, observed_bytes) = hash_file(&model_path)?;
    if observed_bytes != expected_bytes || observed_hash != expected_hash {
        return Err("llama.cpp server model file hash differs from profile".into());
    }
    eprintln!(
        "model_ready alias={} build={} context_tokens={}",
        report.model_alias, report.build_info, report.context_tokens
    );
    Ok(())
}
