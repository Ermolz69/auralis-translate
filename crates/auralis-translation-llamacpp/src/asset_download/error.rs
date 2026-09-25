#[derive(Debug, thiserror::Error)]
pub enum AssetDownloadError {
    #[error("asset download is invalid: {0}")]
    Invalid(&'static str),
    #[error("asset download is busy")]
    Busy,
    #[error(transparent)]
    Manifest(#[from] crate::ReleaseManifestError),
    #[error(transparent)]
    Http(#[from] reqwest::Error),
    #[error(transparent)]
    Io(#[from] std::io::Error),
}
