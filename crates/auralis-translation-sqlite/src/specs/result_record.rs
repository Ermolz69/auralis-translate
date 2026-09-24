use auralis_translation::{ResultId, ReviewState, RunId, SourceHash, TargetSegment};

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ResultRecord {
    pub result_id: ResultId,
    pub run_id: RunId,
    pub revision: u32,
    pub source_hash: SourceHash,
    pub output_hash: SourceHash,
    pub selected: Vec<TargetSegment>,
    pub structural_evidence_json: String,
    pub review_state: ReviewState,
}
