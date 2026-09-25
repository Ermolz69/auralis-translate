use std::path::PathBuf;

pub struct ComparisonRequest {
    pub manifest_path: PathBuf,
    pub archive_path: PathBuf,
    pub corpus_root: PathBuf,
    pub split: String,
    pub language: String,
    pub row_ids: Vec<usize>,
    pub profile_sha256: String,
    pub model_sha256: String,
    pub runtime_build: String,
}
