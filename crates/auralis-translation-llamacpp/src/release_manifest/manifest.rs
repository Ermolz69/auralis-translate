use super::ReleaseAsset;
use super::asset::is_sha256;
use super::model::ModelRelease;
use super::runtime::RuntimeRelease;
use super::{ReleaseManifestError, RuntimeVariant};
use crate::ModelProfile;
use serde::Deserialize;
use sha2::{Digest, Sha256};

const SCHEMA_VERSION: u32 = 1;
const WINDOWS_X64_TARGET: &str = "x86_64-pc-windows-msvc";

#[derive(Clone, Debug, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ReleaseManifest {
    schema_version: u32,
    pub id: String,
    pub target_triple: String,
    profile_sha256: String,
    model: ModelRelease,
    runtime: RuntimeRelease,
}

impl ReleaseManifest {
    pub fn from_json(bytes: &[u8], profile_bytes: &[u8]) -> Result<Self, ReleaseManifestError> {
        let manifest: Self = serde_json::from_slice(bytes).map_err(ReleaseManifestError::Json)?;
        let profile = ModelProfile::from_json(profile_bytes)
            .map_err(|_| ReleaseManifestError::Invalid("checked profile is invalid"))?;
        manifest.validate(profile_bytes, &profile)?;
        Ok(manifest)
    }

    pub fn variants(&self) -> &[RuntimeVariant] {
        &self.runtime.variants
    }

    pub fn model_asset(&self) -> &ReleaseAsset {
        &self.model.file
    }

    pub fn model_notice(&self) -> &ReleaseAsset {
        &self.model.license.notice
    }

    pub fn runtime_notice(&self) -> &ReleaseAsset {
        &self.runtime.license.notice
    }

    pub fn verify_profile(&self, profile_bytes: &[u8]) -> Result<(), ReleaseManifestError> {
        let profile = ModelProfile::from_json(profile_bytes)
            .map_err(|_| ReleaseManifestError::Invalid("checked profile is invalid"))?;
        self.validate(profile_bytes, &profile)
    }

    fn validate(
        &self,
        profile_bytes: &[u8],
        profile: &ModelProfile,
    ) -> Result<(), ReleaseManifestError> {
        if self.schema_version != SCHEMA_VERSION
            || self.target_triple != WINDOWS_X64_TARGET
            || self.id.is_empty()
            || !self
                .id
                .bytes()
                .all(|byte| byte.is_ascii_lowercase() || byte.is_ascii_digit() || byte == b'-')
        {
            return Err(ReleaseManifestError::Invalid(
                "schema, ID or target triple is invalid",
            ));
        }
        let profile_digest = format!("{:x}", Sha256::digest(profile_bytes));
        if !is_sha256(&self.profile_sha256)
            || !self.profile_sha256.eq_ignore_ascii_case(&profile_digest)
            || profile.model_file_bytes.is_none()
            || profile.runtime_build_info.is_none()
            || profile.min_context_tokens.is_none()
        {
            return Err(ReleaseManifestError::Invalid(
                "release must bind a complete checked profile",
            ));
        }
        self.model.validate(profile)?;
        self.runtime.validate(profile)
    }
}
