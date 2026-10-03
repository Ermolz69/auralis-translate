use super::{
    ApprovedTerm, ApprovedTerms, ContractError, Glossary, GlossaryEntry, LanguageCode,
    LanguagePair, RunId, SourceHash, SourceSegment, TranslationId,
};
use sha2::{Digest, Sha256};
use std::collections::HashSet;

pub const TRANSLATION_BATCH_SCHEMA_VERSION: u32 = 1;
const BATCH_FINGERPRINT_VERSION: u32 = 1;
const GLOSSARY_FINGERPRINT_VERSION: u32 = 1;
const APPROVED_TERMS_FINGERPRINT_VERSION: u32 = 1;

#[derive(Clone, Debug)]
pub struct TranslationBatch {
    translation_id: TranslationId,
    run_id: RunId,
    source_hash: SourceHash,
    language_pair: LanguagePair,
    targets: Vec<SourceSegment>,
    context: Vec<SourceSegment>,
    glossary: Vec<GlossaryEntry>,
    approved_terms: Vec<ApprovedTerm>,
    name_registry_identity: Option<SourceHash>,
    name_entities: Vec<super::NameEntity>,
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
        Self::with_glossary(
            translation_id,
            run_id,
            source_hash,
            language_pair,
            targets,
            context,
            Vec::new(),
        )
    }

    pub fn with_glossary(
        translation_id: TranslationId,
        run_id: RunId,
        source_hash: SourceHash,
        language_pair: LanguagePair,
        targets: Vec<SourceSegment>,
        context: Vec<SourceSegment>,
        glossary: Vec<GlossaryEntry>,
    ) -> Result<Self, ContractError> {
        Self::create(
            translation_id,
            run_id,
            source_hash,
            language_pair,
            targets,
            context,
            glossary,
            Vec::new(),
        )
    }

    pub fn with_approved_terms(
        translation_id: TranslationId,
        run_id: RunId,
        source_hash: SourceHash,
        language_pair: LanguagePair,
        targets: Vec<SourceSegment>,
        context: Vec<SourceSegment>,
        approved_terms: Vec<ApprovedTerm>,
    ) -> Result<Self, ContractError> {
        Self::create(
            translation_id,
            run_id,
            source_hash,
            language_pair,
            targets,
            context,
            Vec::new(),
            approved_terms,
        )
    }

    #[allow(clippy::too_many_arguments)]
    fn create(
        translation_id: TranslationId,
        run_id: RunId,
        source_hash: SourceHash,
        language_pair: LanguagePair,
        targets: Vec<SourceSegment>,
        context: Vec<SourceSegment>,
        glossary: Vec<GlossaryEntry>,
        approved_terms: Vec<ApprovedTerm>,
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
        Glossary::validate_entries(&glossary)?;
        if !approved_terms.is_empty() {
            ApprovedTerms::new(approved_terms.clone())?;
        }
        if !glossary.is_empty() && !approved_terms.is_empty() {
            return Err(ContractError::InvalidApprovedTerms);
        }
        if glossary.iter().any(|entry| {
            entry
                .segment_ids()
                .is_some_and(|scope| !targets.iter().any(|target| scope.contains(&target.id())))
        }) {
            return Err(ContractError::InvalidGlossary);
        }
        if approved_terms.iter().any(|entry| {
            !targets.iter().any(|target| {
                entry.segment_ids().contains(&target.id())
                    && target
                        .lines()
                        .iter()
                        .any(|line| line.contains(entry.source()))
            })
        }) {
            return Err(ContractError::InvalidApprovedTerms);
        }
        Ok(Self {
            translation_id,
            run_id,
            source_hash,
            language_pair,
            targets,
            context,
            glossary,
            approved_terms,
            name_registry_identity: None,
            name_entities: Vec::new(),
        })
    }

    pub fn with_name_registry(
        mut self,
        registry: &super::NameRegistry,
    ) -> Result<Self, ContractError> {
        if self.translation_id != registry.translation_id()
            || self.source_hash != registry.source_hash()
        {
            return Err(ContractError::InvalidNameRegistry);
        }
        self.name_registry_identity = Some(registry.fingerprint());
        self.name_entities = registry.applicable(&self.targets);
        Ok(self)
    }

    pub fn name_entities(&self) -> &[super::NameEntity] {
        &self.name_entities
    }
    pub fn name_registry_identity(&self) -> Option<SourceHash> {
        self.name_registry_identity
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

    pub fn glossary(&self) -> &[GlossaryEntry] {
        &self.glossary
    }

    pub fn approved_terms(&self) -> &[ApprovedTerm] {
        &self.approved_terms
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
        if let Some(identity) = self.name_registry_identity {
            hasher.update(b"name-registry-v1");
            hasher.update(identity.bytes());
        }
        if !self.glossary.is_empty() {
            hasher.update(GLOSSARY_FINGERPRINT_VERSION.to_le_bytes());
            hasher.update((self.glossary.len() as u64).to_le_bytes());
            for entry in &self.glossary {
                hash_text(&mut hasher, entry.source());
                hash_text(&mut hasher, entry.target());
                hasher.update((entry.allowed_forms().len() as u64).to_le_bytes());
                for form in entry.allowed_forms() {
                    hash_text(&mut hasher, form);
                }
                match entry.segment_ids() {
                    None => hasher.update([0]),
                    Some(ids) => {
                        hasher.update([1]);
                        hasher.update((ids.len() as u64).to_le_bytes());
                        for id in ids {
                            hasher.update(id.get().to_le_bytes());
                        }
                    }
                }
            }
        }
        if !self.approved_terms.is_empty() {
            hasher.update(APPROVED_TERMS_FINGERPRINT_VERSION.to_le_bytes());
            hasher.update((self.approved_terms.len() as u64).to_le_bytes());
            for entry in &self.approved_terms {
                hash_text(&mut hasher, entry.source());
                hash_text(&mut hasher, entry.target());
                hasher.update((entry.allowed_forms().len() as u64).to_le_bytes());
                for form in entry.allowed_forms() {
                    hash_text(&mut hasher, form);
                }
                hasher.update((entry.segment_ids().len() as u64).to_le_bytes());
                for id in entry.segment_ids() {
                    hasher.update(id.get().to_le_bytes());
                }
                hash_text(&mut hasher, entry.reviewer_id());
                hash_text(&mut hasher, entry.evidence_id());
            }
        }
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
            hash_text(hasher, line);
        }
    }
}

fn hash_text(hasher: &mut Sha256, text: &str) {
    hasher.update((text.len() as u64).to_le_bytes());
    hasher.update(text.as_bytes());
}

fn language_byte(language: LanguageCode) -> u8 {
    match language {
        LanguageCode::Chinese => 1,
        LanguageCode::Japanese => 2,
        LanguageCode::Russian => 3,
    }
}
