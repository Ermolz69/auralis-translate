use auralis_translation_formats::srt::SrtError;
use auralis_translation_formats::vtt::VttError;
use std::{error::Error, fmt};

#[derive(Debug)]
pub(crate) enum DocumentRenderError {
    Srt(SrtError),
    Vtt(VttError),
}

impl fmt::Display for DocumentRenderError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Srt(error) => error.fmt(formatter),
            Self::Vtt(error) => error.fmt(formatter),
        }
    }
}

impl Error for DocumentRenderError {}
