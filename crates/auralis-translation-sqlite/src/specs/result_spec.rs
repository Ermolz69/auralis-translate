use auralis_translation::{ResultId, ReviewState, RunId, SourceHash};

pub struct ResultSpec {
    pub result_id: ResultId,
    pub run_id: RunId,
    pub revision: u32,
    pub source_hash: SourceHash,
    pub block_fingerprints: Vec<SourceHash>,
    pub review_state: ReviewState,
}
