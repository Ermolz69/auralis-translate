use super::{
    SegmentTranslation, VttBlockPolicy, VttDocument, VttError, VttParsePolicy, VttPlanError,
    VttRunError, VttSegment,
};
use auralis_translation::{
    CheckpointStore, Glossary, LanguagePair, PlannedBatches, ProgressSink, RetryPolicy, RunControl,
    RunId, SegmentId, SourceHash, TargetSegment, TranslationId, TranslationProvider,
    VerifiedRenderer, translate_planned_run_with_policy,
};

pub struct VttRunPlan {
    document: VttDocument,
    planned: PlannedBatches,
    source_hash: SourceHash,
}

impl VttRunPlan {
    pub const PARSER_VERSION: u32 = 1;
    pub const STRUCTURAL_EVIDENCE: &'static str =
        r#"{"format":"vtt","verification":"reparse_and_protected_bytes","version":1}"#;

    pub fn new(
        source: &[u8],
        translation_id: TranslationId,
        run_id: RunId,
        pair: LanguagePair,
        policy: VttBlockPolicy,
    ) -> Result<Self, VttPlanError> {
        Self::with_glossary(source, translation_id, run_id, pair, policy, None)
    }

    pub fn with_glossary(
        source: &[u8],
        translation_id: TranslationId,
        run_id: RunId,
        pair: LanguagePair,
        policy: VttBlockPolicy,
        glossary: Option<&Glossary>,
    ) -> Result<Self, VttPlanError> {
        let document = VttDocument::parse(source).map_err(VttPlanError::Inspect)?;
        let source_hash = SourceHash::digest(source);
        let segments = document.source_segments().map_err(VttPlanError::Contract)?;
        let planned = PlannedBatches::new(
            &segments,
            translation_id,
            run_id,
            source_hash,
            pair,
            policy,
            glossary,
        )
        .map_err(VttPlanError::Contract)?;
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
    pub fn source_segments(&self) -> &[VttSegment] {
        self.document.segments()
    }
    pub fn blocks(&self) -> &[Vec<SegmentId>] {
        self.planned.ids()
    }
    pub fn block_fingerprints(&self) -> Vec<SourceHash> {
        self.planned.fingerprints()
    }

    pub fn policy_fingerprint(policy: VttBlockPolicy) -> SourceHash {
        let parse = VttParsePolicy::default();
        let mut bytes = Vec::new();
        bytes.extend_from_slice(b"vtt\0");
        bytes.extend_from_slice(&Self::PARSER_VERSION.to_le_bytes());
        bytes.extend_from_slice(&(policy.max_target_segments() as u64).to_le_bytes());
        bytes.extend_from_slice(&(parse.max_bytes() as u64).to_le_bytes());
        bytes.extend_from_slice(&parse.max_cues().to_le_bytes());
        bytes.extend_from_slice(&(parse.max_line_bytes() as u64).to_le_bytes());
        bytes.extend_from_slice(&(policy.context_before_segments() as u64).to_le_bytes());
        bytes.extend_from_slice(&(policy.context_after_segments() as u64).to_le_bytes());
        SourceHash::digest(&bytes)
    }

    pub fn execute_with_policy<S: CheckpointStore>(
        &self,
        provider: &impl TranslationProvider,
        store: &mut S,
        progress: &mut impl ProgressSink,
        control: &impl RunControl,
        retry: RetryPolicy,
    ) -> Result<Vec<u8>, VttRunError<S::Error>> {
        let accepted = translate_planned_run_with_policy(
            provider,
            store,
            self.planned.ids(),
            self.planned.batches(),
            progress,
            control,
            retry,
        )
        .map_err(VttRunError::Translate)?;
        self.render_selected(&accepted).map_err(VttRunError::Render)
    }

    pub fn render_selected(&self, accepted: &[TargetSegment]) -> Result<Vec<u8>, VttError> {
        let translations = accepted
            .iter()
            .map(|segment| SegmentTranslation {
                id: segment.id,
                lines: segment.lines.clone(),
            })
            .collect::<Vec<_>>();
        self.document.render(&translations)
    }
}

impl VerifiedRenderer for VttRunPlan {
    type Error = VttError;

    fn source_hash(&self) -> SourceHash {
        VttRunPlan::source_hash(self)
    }
    fn render_selected(&self, selected: &[TargetSegment]) -> Result<Vec<u8>, Self::Error> {
        VttRunPlan::render_selected(self, selected)
    }
    fn structural_evidence(&self) -> &'static str {
        Self::STRUCTURAL_EVIDENCE
    }
}
