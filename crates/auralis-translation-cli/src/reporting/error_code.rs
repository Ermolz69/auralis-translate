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
    InternalFailure,
}

impl ErrorCode {
    pub fn exit_code(self) -> u8 {
        match self {
            Self::Usage | Self::InvalidInput | Self::InvalidSource => 2,
            Self::RuntimeFailure => 4,
            Self::Paused => 5,
            Self::StorageFailure | Self::IoFailure => 6,
            Self::Conflict | Self::ModelMismatch => 7,
            Self::InternalFailure => 1,
        }
    }
}
