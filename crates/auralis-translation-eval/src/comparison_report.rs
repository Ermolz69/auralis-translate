use serde::Serialize;

use crate::comparison_row::ComparisonRow;

#[derive(Debug, Serialize)]
pub struct ComparisonReport {
    pub schema_version: u32,
    pub dataset: String,
    pub corpus_source_url: String,
    pub corpus_license_id: String,
    pub corpus_archive_sha256: String,
    pub split: String,
    pub source_language: String,
    pub profile_sha256: String,
    pub model_sha256: String,
    pub runtime_build: String,
    pub rows: Vec<ComparisonRow>,
    pub use_scope: &'static str,
    pub subtitle_holdout: bool,
    pub bilingual_reviewed: bool,
}
