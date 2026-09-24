use crate::srt::{SrtDocument, SrtError};
use std::fmt;

#[derive(Debug)]
pub enum InspectError {
    UnsupportedFormat,
    InvalidSrt(SrtError),
}

impl fmt::Display for InspectError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::UnsupportedFormat => write!(f, "unsupported subtitle format"),
            Self::InvalidSrt(error) => error.fmt(f),
        }
    }
}

impl std::error::Error for InspectError {}

pub fn inspect(source: &[u8]) -> Result<SrtDocument, InspectError> {
    if source.starts_with(b"WEBVTT") || source.starts_with(b"\xef\xbb\xbfWEBVTT") {
        return Err(InspectError::UnsupportedFormat);
    }

    SrtDocument::parse(source).map_err(InspectError::InvalidSrt)
}
