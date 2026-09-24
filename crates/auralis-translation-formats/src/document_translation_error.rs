use crate::InspectError;
use crate::srt::SrtError;
use auralis_translation::{ContractError, TranslateBatchError};
use std::fmt;

#[derive(Debug)]
pub enum DocumentTranslationError {
    Inspect(InspectError),
    Contract(ContractError),
    Provider(TranslateBatchError),
    Render(SrtError),
}

impl fmt::Display for DocumentTranslationError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Inspect(error) => error.fmt(f),
            Self::Contract(error) => error.fmt(f),
            Self::Provider(error) => error.fmt(f),
            Self::Render(error) => error.fmt(f),
        }
    }
}

impl std::error::Error for DocumentTranslationError {}
