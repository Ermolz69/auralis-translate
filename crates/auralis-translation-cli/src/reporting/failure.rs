use super::ErrorCode;
use auralis_translation::{ProviderError, TranslateBatchError, TranslateRunError};
use auralis_translation_formats::{
    InspectError,
    srt::{SrtError, SrtRunError},
    vtt::{VttError, VttRunError},
};
use auralis_translation_llamacpp::ProfileError;
use auralis_translation_sqlite::DbError;
use std::{error::Error, fmt};

#[derive(Debug)]
pub(crate) struct CliFailure {
    pub code: ErrorCode,
    message: String,
}

impl CliFailure {
    pub fn boxed(code: ErrorCode, message: impl Into<String>) -> Box<dyn Error> {
        Box::new(Self {
            code,
            message: message.into(),
        })
    }
}

impl fmt::Display for CliFailure {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        self.message.fmt(f)
    }
}
impl Error for CliFailure {}

pub(crate) fn classify(error: &(dyn Error + 'static)) -> ErrorCode {
    if let Some(code) = super::package_failure::classify(error) {
        return code;
    }
    if let Some(error) = error.downcast_ref::<auralis_translation_formats::srt::SrtPlanError>() {
        return match error {
            auralis_translation_formats::srt::SrtPlanError::Inspect(_) => ErrorCode::InvalidSource,
            _ => ErrorCode::InvalidInput,
        };
    }
    if let Some(error) = error.downcast_ref::<auralis_translation_formats::vtt::VttPlanError>() {
        return match error {
            auralis_translation_formats::vtt::VttPlanError::Inspect(_) => ErrorCode::InvalidSource,
            _ => ErrorCode::InvalidInput,
        };
    }
    if let Some(failure) = error.downcast_ref::<CliFailure>() {
        return failure.code;
    }
    if let Some(error) = error.downcast_ref::<DbError>() {
        return database(error);
    }
    if let Some(error) = error.downcast_ref::<SrtRunError<DbError>>() {
        return match error {
            SrtRunError::Translate(error) => run(error),
            SrtRunError::Render(_) => ErrorCode::InvalidSource,
        };
    }
    if let Some(error) = error.downcast_ref::<VttRunError<DbError>>() {
        return match error {
            VttRunError::Translate(error) => run(error),
            VttRunError::Render(_) => ErrorCode::InvalidSource,
        };
    }
    if error.is::<InspectError>() || error.is::<SrtError>() || error.is::<VttError>() {
        return ErrorCode::InvalidSource;
    }
    if error.is::<ProfileError>()
        || error.is::<auralis_translation::ContractError>()
        || error.is::<auralis_translation::IdError>()
        || error.is::<serde_json::Error>()
    {
        return ErrorCode::InvalidInput;
    }
    if let Some(error) = error.downcast_ref::<ProviderError>() {
        return provider(error);
    }
    if let Some(error) = error.downcast_ref::<TranslateBatchError>() {
        return batch(error);
    }
    if let Some(error) = error.downcast_ref::<std::io::Error>() {
        return io_code(error);
    }
    ErrorCode::InternalFailure
}

pub(super) fn io_code(error: &std::io::Error) -> ErrorCode {
    match error.kind() {
        std::io::ErrorKind::AlreadyExists => ErrorCode::Conflict,
        std::io::ErrorKind::InvalidData | std::io::ErrorKind::InvalidInput => {
            ErrorCode::InvalidInput
        }
        _ => ErrorCode::IoFailure,
    }
}

fn database(error: &DbError) -> ErrorCode {
    match error {
        DbError::PauseRequested => ErrorCode::Paused,
        DbError::Conflict(_) => ErrorCode::Conflict,
        DbError::InvalidSpec(_) => ErrorCode::InvalidInput,
        _ => ErrorCode::StorageFailure,
    }
}

fn run(error: &TranslateRunError<DbError>) -> ErrorCode {
    match error {
        TranslateRunError::Paused => ErrorCode::Paused,
        TranslateRunError::Store(error) => database(error),
        TranslateRunError::Control(_) => ErrorCode::StorageFailure,
        TranslateRunError::Batch(error) => batch(error),
        TranslateRunError::InvalidCheckpoint(_) => ErrorCode::Conflict,
        TranslateRunError::InvalidPlan(_) => ErrorCode::InvalidInput,
    }
}

fn batch(error: &TranslateBatchError) -> ErrorCode {
    match error {
        TranslateBatchError::Provider(error) => provider(error),
        TranslateBatchError::Contract(_) => ErrorCode::RuntimeFailure,
    }
}

fn provider(error: &ProviderError) -> ErrorCode {
    match error {
        ProviderError::NameProposalReviewRequired(_) => ErrorCode::NameProposalReviewRequired,
        _ => ErrorCode::RuntimeFailure,
    }
}
