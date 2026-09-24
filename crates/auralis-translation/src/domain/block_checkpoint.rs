use super::{RunId, SourceHash, TargetSegment, TranslationDiagnostic};

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct BlockCheckpoint {
    pub run_id: RunId,
    pub block_index: u32,
    pub input_fingerprint: SourceHash,
    pub accepted: Vec<TargetSegment>,
    pub diagnostics: Vec<TranslationDiagnostic>,
    pub attempt_count: u32,
}
