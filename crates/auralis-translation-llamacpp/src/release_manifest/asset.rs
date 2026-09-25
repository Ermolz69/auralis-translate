use super::ReleaseManifestError;
use serde::Deserialize;

const TRUSTED_HOSTS: &[&str] = &["github.com", "huggingface.co", "raw.githubusercontent.com"];

#[derive(Clone, Debug, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ReleaseAsset {
    pub url: String,
    pub filename: String,
    pub sha256: String,
    pub bytes: Option<u64>,
}

impl ReleaseAsset {
    pub(super) fn validate(&self) -> Result<(), ReleaseManifestError> {
        let url = reqwest::Url::parse(&self.url)
            .map_err(|_| ReleaseManifestError::Invalid("asset URL is invalid"))?;
        if url.scheme() != "https"
            || !url.username().is_empty()
            || url.password().is_some()
            || url.port().is_some()
            || url.fragment().is_some()
            || url.query().is_some()
            || !TRUSTED_HOSTS.contains(&url.host_str().unwrap_or_default())
        {
            return Err(ReleaseManifestError::Invalid(
                "asset URL must be trusted HTTPS without credentials, port or fragment",
            ));
        }
        if self.filename.is_empty()
            || self.filename == "."
            || self.filename == ".."
            || !self
                .filename
                .bytes()
                .all(|byte| byte.is_ascii_alphanumeric() || matches!(byte, b'.' | b'-' | b'_'))
        {
            return Err(ReleaseManifestError::Invalid("asset filename is unsafe"));
        }
        if !is_sha256(&self.sha256) || self.bytes.is_none_or(|bytes| bytes == 0) {
            return Err(ReleaseManifestError::Invalid(
                "asset digest or byte length is invalid",
            ));
        }
        Ok(())
    }
}

pub(super) fn is_sha256(value: &str) -> bool {
    value.len() == 64 && value.bytes().all(|byte| byte.is_ascii_hexdigit())
}

pub(super) fn is_revision(value: &str) -> bool {
    value.len() == 40 && value.bytes().all(|byte| byte.is_ascii_hexdigit())
}
