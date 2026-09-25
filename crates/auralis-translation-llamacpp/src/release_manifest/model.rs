use super::asset::is_revision;
use super::license::LicenseRelease;
use super::{ReleaseAsset, ReleaseManifestError};
use crate::ModelProfile;
use serde::Deserialize;

#[derive(Clone, Debug, Deserialize)]
#[serde(deny_unknown_fields)]
pub(super) struct ModelRelease {
    pub repository: String,
    pub revision: String,
    pub file: ReleaseAsset,
    pub license: LicenseRelease,
}

impl ModelRelease {
    pub fn validate(&self, profile: &ModelProfile) -> Result<(), ReleaseManifestError> {
        if self.repository != profile.model_repo
            || self.revision != profile.model_revision
            || !is_revision(&self.revision)
            || self.file.bytes != profile.model_file_bytes
            || !self
                .file
                .sha256
                .eq_ignore_ascii_case(&profile.model_file_sha256)
        {
            return Err(ReleaseManifestError::Invalid(
                "model release differs from checked profile",
            ));
        }
        self.file.validate()?;
        self.license.validate()?;
        let file_url = reqwest::Url::parse(&self.file.url)
            .map_err(|_| ReleaseManifestError::Invalid("model URL is invalid"))?;
        let license_url = reqwest::Url::parse(&self.license.notice.url)
            .map_err(|_| ReleaseManifestError::Invalid("model license URL is invalid"))?;
        let pinned_path = format!("/{}/resolve/{}/", self.repository, self.revision);
        if file_url.host_str() != Some("huggingface.co")
            || file_url.path() != format!("{pinned_path}{}", self.file.filename)
            || license_url.host_str() != Some("huggingface.co")
            || license_url.path() != format!("{pinned_path}LICENSE.txt")
        {
            return Err(ReleaseManifestError::Invalid(
                "model and license URLs must pin the model revision",
            ));
        }
        Ok(())
    }
}
