use auralis_translation::SegmentId;

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EditSelection {
    pub segment_id: SegmentId,
    pub revision: u32,
}
