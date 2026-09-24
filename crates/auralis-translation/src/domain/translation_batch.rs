use super::{
    ContractError, LanguageCode, LanguagePair, RunId, SourceHash, SourceSegment, TranslationId,
};
use sha2::{Digest, Sha256};
use std::collections::HashSet;

pub const TRANSLATION_BATCH_SCHEMA_VERSION: u32 = 1;
const BATCH_FINGERPRINT_VERSION: u32 = 1;

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

    pub fn fingerprint(&self) -> SourceHash {
        let mut hasher = Sha256::new();
        hasher.update(BATCH_FINGERPRINT_VERSION.to_le_bytes());
        hasher.update(self.schema_version().to_le_bytes());
        hasher.update(self.translation_id.get().as_bytes());
        hasher.update(self.run_id.get().as_bytes());
        hasher.update(self.source_hash.bytes());
        hasher.update([language_byte(self.language_pair.source())]);
        hasher.update([language_byte(self.language_pair.target())]);
        hash_segments(&mut hasher, &self.targets);
        hash_segments(&mut hasher, &self.context);
        SourceHash::from_bytes(hasher.finalize().into())
    }
}

fn hash_segments(hasher: &mut Sha256, segments: &[SourceSegment]) {
    hasher.update((segments.len() as u64).to_le_bytes());
    for segment in segments {
        hasher.update(segment.id().get().to_le_bytes());
        hasher.update(segment.start_ms().to_le_bytes());
        hasher.update(segment.end_ms().to_le_bytes());
        hasher.update((segment.lines().len() as u64).to_le_bytes());
        for line in segment.lines() {
            hasher.update((line.len() as u64).to_le_bytes());
            hasher.update(line.as_bytes());
        }
    }
}

fn language_byte(language: LanguageCode) -> u8 {
    match language {
        LanguageCode::Chinese => 1,
        LanguageCode::Japanese => 2,
        LanguageCode::Russian => 3,
    }
}
