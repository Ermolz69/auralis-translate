use super::{
    SegmentTranslation, SrtBlockPolicy, SrtDocument, SrtPlanError, SrtRunError, SrtSegment,
};
use crate::inspect;
use auralis_translation::{
    CheckpointStore, LanguagePair, RunId, SegmentId, SourceHash, TargetSegment, TranslationBatch,
    TranslationId, TranslationProvider, VerifiedRenderer, translate_planned_run,
};

pub struct SrtRunPlan {
    document: SrtDocument,
    batches: Vec<TranslationBatch>,
    planned_ids: Vec<Vec<SegmentId>>,
    source_hash: SourceHash,
}

impl SrtRunPlan {
    pub const PARSER_VERSION: u32 = 1;
    pub const STRUCTURAL_EVIDENCE: &'static str =
        r#"{"format":"srt","verification":"reparse_and_protected_bytes","version":1}"#;

    pub fn new(
        source: &[u8],
        translation_id: TranslationId,
        run_id: RunId,
        pair: LanguagePair,
        policy: SrtBlockPolicy,
    ) -> Result<Self, SrtPlanError> {
        let document = inspect(source).map_err(SrtPlanError::Inspect)?;
        let source_hash = SourceHash::digest(source);
        let segments = document.source_segments().map_err(SrtPlanError::Contract)?;
        let mut batches = Vec::new();
        let mut planned_ids = Vec::new();
        for targets in segments.chunks(policy.max_target_segments()) {
            planned_ids.push(targets.iter().map(|segment| segment.id()).collect());
            batches.push(
                TranslationBatch::new(
                    translation_id,
                    run_id,
                    source_hash,
                    pair,
                    targets.to_vec(),
                    Vec::new(),
                )
                .map_err(SrtPlanError::Contract)?,
            );
        }
        Ok(Self {
            document,
            batches,
            planned_ids,
            source_hash,
        })
    }

    pub fn source_hash(&self) -> SourceHash {
        self.source_hash
    }

    pub fn source_len(&self) -> usize {
        self.document.source_bytes().len()
    }

    pub fn source_segments(&self) -> &[SrtSegment] {
        self.document.segments()
    }

    pub fn blocks(&self) -> &[Vec<SegmentId>] {
        &self.planned_ids
    }

    pub fn block_fingerprints(&self) -> Vec<SourceHash> {
        self.batches
            .iter()
            .map(TranslationBatch::fingerprint)
            .collect()
    }

    pub fn policy_fingerprint(policy: SrtBlockPolicy) -> SourceHash {
        let parse = super::SrtParsePolicy::default();
        let mut bytes = Vec::new();
        bytes.extend_from_slice(&Self::PARSER_VERSION.to_le_bytes());
        bytes.extend_from_slice(&(policy.max_target_segments() as u64).to_le_bytes());
        bytes.extend_from_slice(&(parse.max_bytes() as u64).to_le_bytes());
        bytes.extend_from_slice(&parse.max_cues().to_le_bytes());
        bytes.extend_from_slice(&(parse.max_line_bytes() as u64).to_le_bytes());
        SourceHash::digest(&bytes)
    }

    pub fn execute<S: CheckpointStore>(
        &self,
        provider: &impl TranslationProvider,
        store: &mut S,
    ) -> Result<Vec<u8>, SrtRunError<S::Error>> {
        let accepted = translate_planned_run(provider, store, &self.planned_ids, &self.batches)
            .map_err(SrtRunError::Translate)?;
        self.render_selected(&accepted).map_err(SrtRunError::Render)
    }

    pub fn render_selected(&self, accepted: &[TargetSegment]) -> Result<Vec<u8>, super::SrtError> {
        let replacements = accepted
            .iter()
            .map(|segment| SegmentTranslation {
                id: segment.id,
                lines: segment.lines.clone(),
            })
            .collect::<Vec<_>>();
        self.document.render(&replacements)
    }
}

impl VerifiedRenderer for SrtRunPlan {
    type Error = super::SrtError;

    fn source_hash(&self) -> SourceHash {
        SrtRunPlan::source_hash(self)
    }

    fn render_selected(&self, selected: &[TargetSegment]) -> Result<Vec<u8>, Self::Error> {
        SrtRunPlan::render_selected(self, selected)
    }

    fn structural_evidence(&self) -> &'static str {
        Self::STRUCTURAL_EVIDENCE
    }
}
