use super::{ReleaseAsset, ReleaseManifestError};
use serde::Deserialize;

#[derive(Clone, Debug, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct RuntimeVariant {
    pub backend: String,
    pub archive: ReleaseAsset,
    #[serde(default)]
    pub companions: Vec<ReleaseAsset>,
}

impl RuntimeVariant {
    pub(super) fn validate(&self, release_tag: &str) -> Result<(), ReleaseManifestError> {
        if self.backend.is_empty()
            || !self
                .backend
                .bytes()
                .all(|byte| byte.is_ascii_lowercase() || byte.is_ascii_digit() || byte == b'-')
        {
            return Err(ReleaseManifestError::Invalid("runtime backend is invalid"));
        }
        self.archive.validate()?;
        if !is_release_asset(&self.archive, release_tag) {
            return Err(ReleaseManifestError::Invalid(
                "runtime archive URL must pin the release tag",
            ));
        }
        for companion in &self.companions {
            companion.validate()?;
            if !is_release_asset(companion, release_tag) {
                return Err(ReleaseManifestError::Invalid(
                    "runtime companion URL must pin the release tag",
                ));
            }
        }
        Ok(())
    }
}

fn is_release_asset(asset: &ReleaseAsset, release_tag: &str) -> bool {
    let Ok(url) = reqwest::Url::parse(&asset.url) else {
        return false;
    };
    url.host_str() == Some("github.com")
        && url.path()
            == format!(
                "/ggml-org/llama.cpp/releases/download/{release_tag}/{}",
                asset.filename
            )
}
