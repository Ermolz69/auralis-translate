use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub(crate) struct CorpusFile {
    pub(crate) path: String,
    pub(crate) sha256: String,
}
