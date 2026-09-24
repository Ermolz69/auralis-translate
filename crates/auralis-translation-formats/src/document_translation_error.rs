use crate::InspectError;
use crate::srt::SrtError;
use crate::vtt::VttError;
use auralis_translation::{ContractError, TranslateBatchError};
use std::fmt;

#[derive(Debug)]
pub enum DocumentTranslationError {
    Inspect(InspectError),
    InspectVtt(VttError),
    Contract(ContractError),
    Provider(TranslateBatchError),
    Render(SrtError),
    RenderVtt(VttError),
}

impl fmt::Display for DocumentTranslationError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Inspect(error) => error.fmt(f),
            Self::InspectVtt(error) => error.fmt(f),
            Self::Contract(error) => error.fmt(f),
            Self::Provider(error) => error.fmt(f),
            Self::Render(error) => error.fmt(f),
            Self::RenderVtt(error) => error.fmt(f),
        }
    }
}

impl std::error::Error for DocumentTranslationError {}
