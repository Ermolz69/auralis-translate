use crate::{ModelProfile, ServerReport};
use auralis_translation::ProviderError;
use std::path::{Path, PathBuf};

pub fn verify_server_report_metadata(
    report: &ServerReport,
    profile: &ModelProfile,
) -> Result<PathBuf, ProviderError> {
    let expected_bytes = profile
        .model_file_bytes
        .ok_or_else(|| ProviderError::Permanent("checked model profile has no file size".into()))?;
    let expected_build = profile
        .runtime_build_info
        .as_deref()
        .ok_or_else(|| ProviderError::Permanent("profile runtime build is missing".into()))?;
    let minimum_context = profile
        .min_context_tokens
        .ok_or_else(|| ProviderError::Permanent("profile minimum context is missing".into()))?;
    if report.model_alias != profile.model_alias || report.build_info != expected_build {
        return Err(ProviderError::Permanent(
            "llama.cpp server model alias or runtime build differs from profile".into(),
        ));
    }
    if report.context_tokens < minimum_context {
        return Err(ProviderError::Permanent(
            "llama.cpp server context is smaller than profile minimum".into(),
        ));
    }
    let reported_path = Path::new(&report.model_path);
    if !reported_path.is_absolute() {
        return Err(ProviderError::Permanent(
            "llama.cpp server model path must be absolute for verification".into(),
        ));
    }
    let model_path = std::fs::canonicalize(reported_path)
        .map_err(|error| ProviderError::Permanent(error.to_string()))?;
    if std::fs::metadata(&model_path)
        .map_err(|error| ProviderError::Permanent(error.to_string()))?
        .len()
        != expected_bytes
    {
        return Err(ProviderError::Permanent(
            "llama.cpp server model file size differs from profile".into(),
        ));
    }
    Ok(model_path)
}
