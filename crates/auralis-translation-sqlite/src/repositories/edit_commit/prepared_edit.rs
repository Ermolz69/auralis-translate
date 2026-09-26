use auralis_translation::{SourceHash, TargetSegment};

pub(super) struct PreparedEdit {
    pub selected: Vec<TargetSegment>,
    pub output_hash: SourceHash,
    pub evidence_json: String,
}
