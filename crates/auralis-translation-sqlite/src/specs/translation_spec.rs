use auralis_translation::{LanguagePair, SourceHash, TranslationId};

pub struct TranslationSpec {
    pub translation_id: TranslationId,
    pub project_id: Option<String>,
    pub source_artifact_id: Option<String>,
    pub source_locator: Option<String>,
    pub source_hash: SourceHash,
    pub source_format: String,
    pub language_pair: LanguagePair,
}
