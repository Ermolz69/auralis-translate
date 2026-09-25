use super::asset::is_revision;
use super::license::LicenseRelease;
use super::{ReleaseManifestError, RuntimeVariant};
use crate::ModelProfile;
use serde::Deserialize;
use std::collections::HashSet;

#[derive(Clone, Debug, Deserialize)]
#[serde(deny_unknown_fields)]
pub(super) struct RuntimeRelease {
    pub repository: String,
    pub source_commit: String,
    pub release_tag: String,
    pub build_info: String,
    pub license: LicenseRelease,
    pub variants: Vec<RuntimeVariant>,
}

impl RuntimeRelease {
    pub fn validate(&self, profile: &ModelProfile) -> Result<(), ReleaseManifestError> {
        if self.repository != "ggml-org/llama.cpp"
            || !is_revision(&self.source_commit)
            || self.release_tag.is_empty()
            || !self
                .release_tag
                .bytes()
                .all(|byte| byte.is_ascii_lowercase() || byte.is_ascii_digit())
            || self.build_info != format!("{}-{}", self.release_tag, &self.source_commit[..9])
            || profile.runtime_build_info.as_deref() != Some(&self.build_info)
        {
            return Err(ReleaseManifestError::Invalid(
                "runtime release differs from checked profile",
            ));
        }
        self.license.validate()?;
        let license_url = reqwest::Url::parse(&self.license.notice.url)
            .map_err(|_| ReleaseManifestError::Invalid("runtime license URL is invalid"))?;
        if license_url.host_str() != Some("raw.githubusercontent.com")
            || license_url.path() != format!("/ggml-org/llama.cpp/{}/LICENSE", self.source_commit)
        {
            return Err(ReleaseManifestError::Invalid(
                "runtime license URL must pin the source commit",
            ));
        }
        if self.variants.is_empty() || self.variants.len() > 8 {
            return Err(ReleaseManifestError::Invalid(
                "runtime variants are invalid",
            ));
        }
        let mut backends = HashSet::new();
        for variant in &self.variants {
            variant.validate(&self.release_tag)?;
            if !backends.insert(&variant.backend) {
                return Err(ReleaseManifestError::Invalid("duplicate runtime backend"));
            }
        }
        Ok(())
    }
}
