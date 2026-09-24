use auralis_translation::{RunId, SourceHash, TargetSegment};

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CheckpointSpec {
    pub run_id: RunId,
    pub block_index: u32,
    pub input_fingerprint: SourceHash,
    pub accepted: Vec<TargetSegment>,
    pub diagnostics_json: String,
    pub attempt_count: u32,
}
