use crate::InspectError;
use crate::srt::SrtDocument;

pub fn inspect(source: &[u8]) -> Result<SrtDocument, InspectError> {
    if source.starts_with(b"WEBVTT") || source.starts_with(b"\xef\xbb\xbfWEBVTT") {
        return Err(InspectError::UnsupportedFormat);
    }

    SrtDocument::parse(source).map_err(InspectError::InvalidSrt)
}
