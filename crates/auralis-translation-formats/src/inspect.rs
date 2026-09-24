use crate::InspectError;
use crate::srt::{SrtDocument, SrtParsePolicy};

pub fn inspect(source: &[u8]) -> Result<SrtDocument, InspectError> {
    inspect_with_policy(source, SrtParsePolicy::default())
}

pub fn inspect_with_policy(
    source: &[u8],
    policy: SrtParsePolicy,
) -> Result<SrtDocument, InspectError> {
    if source.starts_with(b"WEBVTT") || source.starts_with(b"\xef\xbb\xbfWEBVTT") {
        return Err(InspectError::UnsupportedFormat);
    }

    SrtDocument::parse_with_policy(source, policy).map_err(InspectError::InvalidSrt)
}
