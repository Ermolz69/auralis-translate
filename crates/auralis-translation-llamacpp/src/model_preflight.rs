use crate::{LlamaCppProvider, ModelProfile, ServerReport, hash_file};
use auralis_translation::{ProviderError, SourceHash};
use std::path::Path;

pub fn verify_server(
    provider: &LlamaCppProvider,
    profile: &ModelProfile,
) -> Result<Option<ServerReport>, ProviderError> {
    let Some(expected_bytes) = profile.model_file_bytes else {
        return Ok(None);
    };
    let expected_build = profile
        .runtime_build_info
        .as_deref()
        .ok_or_else(|| ProviderError("profile runtime build is missing".into()))?;
    let minimum_context = profile
        .min_context_tokens
        .ok_or_else(|| ProviderError("profile minimum context is missing".into()))?;
    let report = provider.probe_server()?;
    if report.model_alias != profile.model_alias || report.build_info != expected_build {
        return Err(ProviderError(
            "llama.cpp server model alias or runtime build differs from profile".into(),
        ));
    }
    if report.context_tokens < minimum_context {
        return Err(ProviderError(
            "llama.cpp server context is smaller than profile minimum".into(),
        ));
    }
    let reported_path = Path::new(&report.model_path);
    if !reported_path.is_absolute() {
        return Err(ProviderError(
            "llama.cpp server model path must be absolute for verification".into(),
        ));
    }
    let model_path =
        std::fs::canonicalize(reported_path).map_err(|error| ProviderError(error.to_string()))?;
    if std::fs::metadata(&model_path)
        .map_err(|error| ProviderError(error.to_string()))?
        .len()
        != expected_bytes
    {
        return Err(ProviderError(
            "llama.cpp server model file size differs from profile".into(),
        ));
    }
    let expected_hash = SourceHash::parse_hex(&profile.model_file_sha256)
        .ok_or_else(|| ProviderError("profile model SHA-256 is invalid".into()))?;
    let (observed_hash, observed_bytes) = hash_file(&model_path)?;
    if observed_bytes != expected_bytes || observed_hash != expected_hash {
        return Err(ProviderError(
            "llama.cpp server model file hash differs from profile".into(),
        ));
    }
    Ok(Some(report))
}
