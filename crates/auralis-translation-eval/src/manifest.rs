use serde::Deserialize;

use crate::{corpus_file::CorpusFile, split::Split};

#[derive(Debug, Deserialize)]
pub(crate) struct Manifest {
    pub(crate) schema_version: u32,
    pub(crate) dataset: String,
    pub(crate) release: String,
    pub(crate) source_url: String,
    pub(crate) license_id: String,
    pub(crate) archive: CorpusFile,
    pub(crate) splits: Vec<Split>,
}
