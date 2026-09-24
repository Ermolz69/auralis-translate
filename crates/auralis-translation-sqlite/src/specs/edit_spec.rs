use auralis_translation::{ResultId, SegmentId};

pub struct EditSpec {
    pub base_result_id: ResultId,
    pub result_id: ResultId,
    pub segment_id: SegmentId,
    pub lines: Vec<String>,
}
