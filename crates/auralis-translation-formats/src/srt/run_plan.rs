use super::{
    SegmentTranslation, SrtBlockPolicy, SrtDocument, SrtPlanError, SrtRunError, SrtSegment,
};
use crate::inspect;
use auralis_translation::{
    CheckpointStore, Glossary, LanguagePair, PlannedBatches, ProgressSink, RetryPolicy, RunControl,
    RunId, SegmentId, SourceHash, TargetSegment, TranslationId, TranslationProvider,
    VerifiedRenderer, translate_planned_run, translate_planned_run_with_control,
    translate_planned_run_with_policy, translate_planned_run_with_progress,
};

pub struct SrtRunPlan {
    document: SrtDocument,
    planned: PlannedBatches,
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
        Self::with_glossary(source, translation_id, run_id, pair, policy, None)
    }

    pub fn with_glossary(
        source: &[u8],
        translation_id: TranslationId,
        run_id: RunId,
        pair: LanguagePair,
        policy: SrtBlockPolicy,
        glossary: Option<&Glossary>,
    ) -> Result<Self, SrtPlanError> {
        let document = inspect(source).map_err(SrtPlanError::Inspect)?;
        let source_hash = SourceHash::digest(source);
        let segments = document.source_segments().map_err(SrtPlanError::Contract)?;
        let planned = PlannedBatches::new(
            &segments,
            translation_id,
            run_id,
            source_hash,
            pair,
            policy,
            glossary,
        )
        .map_err(SrtPlanError::Contract)?;
        Ok(Self {
            document,
            planned,
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
        self.planned.ids()
    }

    pub fn block_fingerprints(&self) -> Vec<SourceHash> {
        self.planned.fingerprints()
    }

    pub fn policy_fingerprint(policy: SrtBlockPolicy) -> SourceHash {
        let parse = super::SrtParsePolicy::default();
        let mut bytes = Vec::new();
        bytes.extend_from_slice(&Self::PARSER_VERSION.to_le_bytes());
        bytes.extend_from_slice(&(policy.max_target_segments() as u64).to_le_bytes());
        bytes.extend_from_slice(&(parse.max_bytes() as u64).to_le_bytes());
        bytes.extend_from_slice(&parse.max_cues().to_le_bytes());
        bytes.extend_from_slice(&(parse.max_line_bytes() as u64).to_le_bytes());
        if policy.context_before_segments() != 0 || policy.context_after_segments() != 0 {
            const CONTEXT_POLICY_VERSION: u32 = 2;
            bytes.extend_from_slice(&CONTEXT_POLICY_VERSION.to_le_bytes());
            bytes.extend_from_slice(&(policy.context_before_segments() as u64).to_le_bytes());
            bytes.extend_from_slice(&(policy.context_after_segments() as u64).to_le_bytes());
        }
        SourceHash::digest(&bytes)
    }

    pub fn execute<S: CheckpointStore>(
        &self,
        provider: &impl TranslationProvider,
        store: &mut S,
    ) -> Result<Vec<u8>, SrtRunError<S::Error>> {
        let accepted =
            translate_planned_run(provider, store, self.planned.ids(), self.planned.batches())
                .map_err(SrtRunError::Translate)?;
        self.render_selected(&accepted).map_err(SrtRunError::Render)
    }

    pub fn execute_with_progress<S: CheckpointStore>(
        &self,
        provider: &impl TranslationProvider,
        store: &mut S,
        progress: &mut impl ProgressSink,
    ) -> Result<Vec<u8>, SrtRunError<S::Error>> {
        let accepted = translate_planned_run_with_progress(
            provider,
            store,
            self.planned.ids(),
            self.planned.batches(),
            progress,
        )
        .map_err(SrtRunError::Translate)?;
        self.render_selected(&accepted).map_err(SrtRunError::Render)
    }

    pub fn execute_with_control<S: CheckpointStore>(
        &self,
        provider: &impl TranslationProvider,
        store: &mut S,
        progress: &mut impl ProgressSink,
        control: &impl RunControl,
    ) -> Result<Vec<u8>, SrtRunError<S::Error>> {
        let accepted = translate_planned_run_with_control(
            provider,
            store,
            self.planned.ids(),
            self.planned.batches(),
            progress,
            control,
        )
        .map_err(SrtRunError::Translate)?;
        self.render_selected(&accepted).map_err(SrtRunError::Render)
    }

    pub fn execute_with_policy<S: CheckpointStore>(
        &self,
        provider: &impl TranslationProvider,
        store: &mut S,
        progress: &mut impl ProgressSink,
        control: &impl RunControl,
        retry: RetryPolicy,
    ) -> Result<Vec<u8>, SrtRunError<S::Error>> {
        let accepted = translate_planned_run_with_policy(
            provider,
            store,
            self.planned.ids(),
            self.planned.batches(),
            progress,
            control,
            retry,
        )
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
