use crate::SegmentId;
use std::ops::Range;

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct NameOccurrence {
    pub segment_id: SegmentId,
    pub line_index: usize,
    pub bytes: Range<usize>,
    pub scene_index: usize,
    pub surface: String,
}
