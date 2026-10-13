use crate::{
    LlamaCppProvider, ModelProfile, PreparationControl, ServerReport, hash_file_with_control,
    verify_server_report_metadata,
};
use auralis_translation::{ProviderError, SourceHash};

pub fn verify_server(
    provider: &LlamaCppProvider,
    profile: &ModelProfile,
) -> Result<Option<ServerReport>, ProviderError> {
    verify_server_with_control(provider, profile, &|| Ok(()))
}

pub fn verify_server_with_control(
    provider: &LlamaCppProvider,
    profile: &ModelProfile,
    control: &dyn PreparationControl,
) -> Result<Option<ServerReport>, ProviderError> {
    control.check()?;
    let Some(expected_bytes) = profile.model_file_bytes else {
        return Ok(None);
    };
    let report = provider.probe_server_with_control(control)?;
    let model_path = verify_server_report_metadata(&report, profile)?;
    let expected_hash = SourceHash::parse_hex(&profile.model_file_sha256)
        .ok_or_else(|| ProviderError::Permanent("profile model SHA-256 is invalid".into()))?;
    let (observed_hash, observed_bytes) = hash_file_with_control(&model_path, control)?;
    if observed_bytes != expected_bytes || observed_hash != expected_hash {
        return Err(ProviderError::Permanent(
            "llama.cpp server model file hash differs from profile".into(),
        ));
    }
    Ok(Some(report))
}
