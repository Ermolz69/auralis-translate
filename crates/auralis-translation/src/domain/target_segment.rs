use super::SegmentId;

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TargetSegment {
    pub id: SegmentId,
    pub lines: Vec<String>,
}
