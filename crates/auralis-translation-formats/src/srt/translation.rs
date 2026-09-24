use auralis_translation::SegmentId;

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SegmentTranslation {
    pub id: SegmentId,
    pub lines: Vec<String>,
}
