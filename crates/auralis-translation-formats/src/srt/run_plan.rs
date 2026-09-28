use super::{
    SegmentTranslation, SrtBlockPolicy, SrtDocument, SrtPlanError, SrtRunError, SrtSegment,
};
use crate::inspect;
use auralis_translation::{
    ApprovedTerms, CheckpointStore, Glossary, LanguagePair, PlannedBatches, ProgressSink,
    RetryPolicy, RunControl, RunId, SceneMap, SegmentId, SourceHash, TargetSegment, TranslationId,
    TranslationProvider, VerifiedRenderer, translate_planned_run,
    translate_planned_run_with_control, translate_planned_run_with_policy,
    translate_planned_run_with_progress,
};

pub struct SrtRunPlan {
    document: SrtDocument,
    planned: PlannedBatches,
    source_hash: SourceHash,
    scene_identity: Option<SourceHash>,
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
        Self::create(
            source,
            translation_id,
            run_id,
            pair,
            policy,
            glossary,
            None,
            None,
        )
    }

    pub fn with_scene_map(
        source: &[u8],
        translation_id: TranslationId,
        run_id: RunId,
        pair: LanguagePair,
        policy: SrtBlockPolicy,
        scene_end_ids: &[SegmentId],
        scene_snapshot_hash: SourceHash,
    ) -> Result<Self, SrtPlanError> {
        Self::create(
            source,
            translation_id,
            run_id,
            pair,
            policy,
            None,
            Some((scene_end_ids, scene_snapshot_hash)),
            None,
        )
    }

    #[allow(clippy::too_many_arguments)]
    pub fn with_scene_map_and_terms(
        source: &[u8],
        translation_id: TranslationId,
        run_id: RunId,
        pair: LanguagePair,
        policy: SrtBlockPolicy,
        scene_end_ids: &[SegmentId],
        scene_snapshot_hash: SourceHash,
        terms: &ApprovedTerms,
    ) -> Result<Self, SrtPlanError> {
        Self::create(
            source,
            translation_id,
            run_id,
            pair,
            policy,
            None,
            Some((scene_end_ids, scene_snapshot_hash)),
            Some(terms),
        )
    }

    #[allow(clippy::too_many_arguments)]
    fn create(
        source: &[u8],
        translation_id: TranslationId,
        run_id: RunId,
        pair: LanguagePair,
        policy: SrtBlockPolicy,
        glossary: Option<&Glossary>,
        scene: Option<(&[SegmentId], SourceHash)>,
        approved_terms: Option<&ApprovedTerms>,
    ) -> Result<Self, SrtPlanError> {
        let document = inspect(source).map_err(SrtPlanError::Inspect)?;
        let source_hash = SourceHash::digest(source);
        let segments = document.source_segments().map_err(SrtPlanError::Contract)?;
        let (planned, scene_identity) = if let Some((end_ids, snapshot_hash)) = scene {
            let map = SceneMap::new(&segments, end_ids).map_err(SrtPlanError::Contract)?;
            let planned = if let Some(terms) = approved_terms {
                PlannedBatches::with_scenes_and_terms(
                    &segments,
                    &map,
                    translation_id,
                    run_id,
                    source_hash,
                    pair,
                    policy,
                    terms,
                )
            } else {
                PlannedBatches::with_scenes(
                    &segments,
                    &map,
                    translation_id,
                    run_id,
                    source_hash,
                    pair,
                    policy,
                    glossary,
                )
            }
            .map_err(SrtPlanError::Contract)?;
            let mut identity = Vec::new();
            identity.extend_from_slice(&map.fingerprint().bytes());
            identity.extend_from_slice(&snapshot_hash.bytes());
            (planned, Some(SourceHash::digest(&identity)))
        } else {
            if approved_terms.is_some() {
                return Err(SrtPlanError::Contract(
                    auralis_translation::ContractError::InvalidApprovedTerms,
                ));
            }
            (
                PlannedBatches::new(
                    &segments,
                    translation_id,
                    run_id,
                    source_hash,
                    pair,
                    policy,
                    glossary,
                )
                .map_err(SrtPlanError::Contract)?,
                None,
            )
        };
        Ok(Self {
            document,
            planned,
            source_hash,
            scene_identity,
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

    pub fn policy_fingerprint_for_run(&self, policy: SrtBlockPolicy) -> SourceHash {
        let base = Self::policy_fingerprint(policy);
        let Some(scene_identity) = self.scene_identity else {
            return base;
        };
        let mut bytes = Vec::new();
        bytes.extend_from_slice(&base.bytes());
        bytes.extend_from_slice(&scene_identity.bytes());
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
