use auralis_translation::{ResultId, SegmentId};

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EditProvenance {
    pub base_result_id: ResultId,
    pub observed_head_result_id: ResultId,
    pub segment_id: SegmentId,
}
