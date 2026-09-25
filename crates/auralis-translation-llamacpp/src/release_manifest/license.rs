use super::{ReleaseAsset, ReleaseManifestError};
use serde::Deserialize;

#[derive(Clone, Debug, Deserialize)]
#[serde(deny_unknown_fields)]
pub(super) struct LicenseRelease {
    pub spdx: String,
    pub notice: ReleaseAsset,
}

impl LicenseRelease {
    pub fn validate(&self) -> Result<(), ReleaseManifestError> {
        if self.spdx.is_empty()
            || !self
                .spdx
                .bytes()
                .all(|byte| byte.is_ascii_alphanumeric() || matches!(byte, b'.' | b'-' | b'+'))
        {
            return Err(ReleaseManifestError::Invalid(
                "license identifier is invalid",
            ));
        }
        self.notice.validate()
    }
}
