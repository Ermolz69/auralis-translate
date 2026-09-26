use super::{ErrorCode, failure::io_code};
use auralis_translation_llamacpp::{AssetDownloadError, OfflineInstallError, ReleaseManifestError};
use std::error::Error;

pub(super) fn classify(error: &(dyn Error + 'static)) -> Option<ErrorCode> {
    if error.is::<ReleaseManifestError>() {
        return Some(ErrorCode::InvalidInput);
    }
    if let Some(error) = error.downcast_ref::<AssetDownloadError>() {
        return Some(match error {
            AssetDownloadError::Invalid(_) | AssetDownloadError::Manifest(_) => {
                ErrorCode::InvalidInput
            }
            AssetDownloadError::Busy => ErrorCode::Conflict,
            AssetDownloadError::Integrity { .. } => ErrorCode::AssetMismatch,
            AssetDownloadError::Response(_)
            | AssetDownloadError::HttpStatus(_)
            | AssetDownloadError::TransferIo(_)
            | AssetDownloadError::Http(_) => ErrorCode::DownloadFailure,
            AssetDownloadError::Hash(_) => ErrorCode::IoFailure,
            AssetDownloadError::Io(error) => io_code(error),
        });
    }
    error
        .downcast_ref::<OfflineInstallError>()
        .map(|error| match error {
            OfflineInstallError::AlreadyInstalled => ErrorCode::Conflict,
            OfflineInstallError::Integrity { .. } => ErrorCode::AssetMismatch,
            OfflineInstallError::Manifest(_) => ErrorCode::InvalidInput,
            OfflineInstallError::Invalid(_) => ErrorCode::InvalidPackage,
            OfflineInstallError::Preparation(_) => ErrorCode::RuntimeFailure,
            OfflineInstallError::Io(error) => io_code(error),
            OfflineInstallError::Zip(error) => error
                .source()
                .and_then(|error| error.downcast_ref::<std::io::Error>())
                .map_or(ErrorCode::InvalidPackage, io_code),
        })
}
