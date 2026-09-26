use serde::Serialize;

#[derive(Debug, Clone, Copy, Serialize)]
#[serde(rename_all = "snake_case")]
pub(crate) enum ErrorCode {
    Usage,
    InvalidInput,
    InvalidSource,
    RuntimeFailure,
    Paused,
    StorageFailure,
    IoFailure,
    Conflict,
    ModelMismatch,
    DownloadFailure,
    AssetMismatch,
    InvalidPackage,
    InternalFailure,
}

impl ErrorCode {
    pub fn exit_code(self) -> u8 {
        match self {
            Self::Usage | Self::InvalidInput | Self::InvalidSource | Self::InvalidPackage => 2,
            Self::RuntimeFailure | Self::DownloadFailure => 4,
            Self::Paused => 5,
            Self::StorageFailure | Self::IoFailure => 6,
            Self::Conflict | Self::ModelMismatch | Self::AssetMismatch => 7,
            Self::InternalFailure => 1,
        }
    }
}
