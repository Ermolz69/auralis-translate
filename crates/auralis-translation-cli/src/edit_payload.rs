use crate::read_source::read_bounded;
use auralis_translation::SegmentId;
use auralis_translation_formats::srt::SrtParsePolicy;
use serde::Deserialize;
use std::error::Error;
use std::path::Path;

const EDIT_PAYLOAD_SCHEMA_VERSION: u32 = 1;

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
pub(crate) struct EditPayload {
    schema_version: u32,
    segment_id: u32,
    pub lines: Vec<String>,
}

impl EditPayload {
    pub fn read(path: &Path) -> Result<(SegmentId, Self), Box<dyn Error>> {
        let bytes = read_bounded(path, SrtParsePolicy::default().max_bytes(), "edit payload")?;
        let payload: Self = serde_json::from_slice(&bytes)?;
        if payload.schema_version != EDIT_PAYLOAD_SCHEMA_VERSION {
            return Err("unsupported edit payload schema version".into());
        }
        let segment_id = SegmentId::new(payload.segment_id).ok_or("zero edit segment ID")?;
        Ok((segment_id, payload))
    }
}
