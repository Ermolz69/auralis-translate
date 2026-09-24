use auralis_translation::{RunId, SegmentId, SourceHash, TranslationId};

pub struct RunSpec {
    pub run_id: RunId,
    pub translation_id: TranslationId,
    pub source_hash: SourceHash,
    pub profile_fingerprint: String,
    pub parser_version: u32,
    pub policy_fingerprint: String,
    pub glossary_revision: Option<String>,
    pub blocks: Vec<Vec<SegmentId>>,
}
