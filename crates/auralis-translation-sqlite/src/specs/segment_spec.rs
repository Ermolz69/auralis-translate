use auralis_translation::SegmentId;
use std::ops::Range;

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SegmentSpec {
    pub id: SegmentId,
    pub ordinal: u32,
    pub cue_label: Option<String>,
    pub start_ms: u64,
    pub end_ms: u64,
    pub source_lines: Vec<String>,
    pub text_ranges: Vec<Range<u64>>,
    pub parser_version: u32,
}
