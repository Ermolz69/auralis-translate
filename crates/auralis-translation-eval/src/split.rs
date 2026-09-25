use std::collections::BTreeMap;

use serde::Deserialize;

use crate::corpus_file::CorpusFile;

#[derive(Debug, Deserialize)]
pub(crate) struct Split {
    pub(crate) name: String,
    pub(crate) expected_rows: usize,
    pub(crate) files: BTreeMap<String, CorpusFile>,
}
