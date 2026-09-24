use super::TextSlot;
use auralis_translation::SegmentId;

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VttSegment {
    pub id: SegmentId,
    pub cue_id: Option<String>,
    pub start_ms: u64,
    pub end_ms: u64,
    pub text_slots: Vec<TextSlot>,
}
