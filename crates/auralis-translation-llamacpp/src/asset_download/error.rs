#[derive(Debug, thiserror::Error)]
pub enum AssetDownloadError {
    #[error("asset download is invalid: {0}")]
    Invalid(&'static str),
    #[error("asset download is busy")]
    Busy,
    #[error("asset differs from pinned length or digest: {filename}")]
    Integrity { filename: String },
    #[error("invalid asset response: {0}")]
    Response(&'static str),
    #[error("asset server returned HTTP {0}")]
    HttpStatus(u16),
    #[error("asset response body could not be read: {0}")]
    TransferIo(#[source] std::io::Error),
    #[error("asset file could not be hashed: {0}")]
    Hash(#[source] auralis_translation::ProviderError),
    #[error(transparent)]
    Manifest(#[from] crate::ReleaseManifestError),
    #[error(transparent)]
    Http(#[from] reqwest::Error),
    #[error(transparent)]
    Io(#[from] std::io::Error),
}
