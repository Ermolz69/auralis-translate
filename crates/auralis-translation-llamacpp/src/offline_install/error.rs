#[derive(Debug, thiserror::Error)]
pub enum OfflineInstallError {
    #[error(transparent)]
    Preparation(#[from] auralis_translation::ProviderError),
    #[error("offline installation is invalid: {0}")]
    Invalid(&'static str),
    #[error(transparent)]
    Manifest(#[from] crate::ReleaseManifestError),
    #[error(transparent)]
    Io(#[from] std::io::Error),
    #[error(transparent)]
    Zip(#[from] zip::result::ZipError),
}
