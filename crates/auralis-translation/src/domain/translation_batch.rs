use super::{ContractError, LanguagePair, RunId, SourceHash, SourceSegment, TranslationId};
use std::collections::HashSet;

pub const TRANSLATION_BATCH_SCHEMA_VERSION: u32 = 1;

#[derive(Clone, Debug)]
pub struct TranslationBatch {
    translation_id: TranslationId,
    run_id: RunId,
    source_hash: SourceHash,
    language_pair: LanguagePair,
    targets: Vec<SourceSegment>,
    context: Vec<SourceSegment>,
}

impl TranslationBatch {
    pub fn new(
        translation_id: TranslationId,
        run_id: RunId,
        source_hash: SourceHash,
        language_pair: LanguagePair,
        targets: Vec<SourceSegment>,
        context: Vec<SourceSegment>,
    ) -> Result<Self, ContractError> {
        if targets.is_empty() {
            return Err(ContractError::EmptyTargets);
        }
        let mut ids = HashSet::new();
        if targets
            .iter()
            .chain(&context)
            .any(|item| !ids.insert(item.id()))
        {
            return Err(ContractError::DuplicateSegmentId);
        }
        Ok(Self {
            translation_id,
            run_id,
            source_hash,
            language_pair,
            targets,
            context,
        })
    }

    pub fn schema_version(&self) -> u32 {
        TRANSLATION_BATCH_SCHEMA_VERSION
    }

    pub fn translation_id(&self) -> TranslationId {
        self.translation_id
    }

    pub fn run_id(&self) -> RunId {
        self.run_id
    }

    pub fn source_hash(&self) -> SourceHash {
        self.source_hash
    }

    pub fn language_pair(&self) -> LanguagePair {
        self.language_pair
    }

    pub fn targets(&self) -> &[SourceSegment] {
        &self.targets
    }

    pub fn context(&self) -> &[SourceSegment] {
        &self.context
    }
}
