use crate::document_run_error::DocumentRunError;
use auralis_translation::ProgressSink;
use auralis_translation::{
    ApprovedTerms, BlockPolicy, Glossary, LanguagePair, RetryPolicy, RunId, SegmentId, SourceHash,
    TargetSegment, TranslationId, VerifiedRenderer,
};
use auralis_translation_formats::srt::{SrtRunError, SrtRunPlan};
use auralis_translation_formats::vtt::{VttRunError, VttRunPlan};
use auralis_translation_llamacpp::LlamaCppProvider;
use auralis_translation_sqlite::TranslateDb;
use std::error::Error;

pub(crate) enum DocumentRunPlan {
    Srt(SrtRunPlan),
    Vtt(VttRunPlan),
}

impl DocumentRunPlan {
    pub const SRT_FORMAT: &'static str = "srt";
    pub const VTT_FORMAT: &'static str = "vtt";

    pub fn new(
        format: &str,
        source: &[u8],
        translation_id: TranslationId,
        run_id: RunId,
        pair: LanguagePair,
        policy: BlockPolicy,
        glossary: Option<&Glossary>,
    ) -> Result<Self, Box<dyn Error>> {
        match format {
            Self::SRT_FORMAT => Ok(Self::Srt(SrtRunPlan::with_glossary(
                source,
                translation_id,
                run_id,
                pair,
                policy,
                glossary,
            )?)),
            Self::VTT_FORMAT => Ok(Self::Vtt(VttRunPlan::with_glossary(
                source,
                translation_id,
                run_id,
                pair,
                policy,
                glossary,
            )?)),
            _ => Err("unsupported standalone source format".into()),
        }
    }

    #[allow(clippy::too_many_arguments)]
    pub fn with_scene_map(
        format: &str,
        source: &[u8],
        translation_id: TranslationId,
        run_id: RunId,
        pair: LanguagePair,
        policy: BlockPolicy,
        scene_end_ids: &[SegmentId],
        scene_snapshot_hash: SourceHash,
    ) -> Result<Self, Box<dyn Error>> {
        if format != Self::SRT_FORMAT {
            return Err("scene maps require SRT source".into());
        }
        Ok(Self::Srt(SrtRunPlan::with_scene_map(
            source,
            translation_id,
            run_id,
            pair,
            policy,
            scene_end_ids,
            scene_snapshot_hash,
        )?))
    }

    #[allow(clippy::too_many_arguments)]
    pub fn with_scene_map_and_terms(
        format: &str,
        source: &[u8],
        translation_id: TranslationId,
        run_id: RunId,
        pair: LanguagePair,
        policy: BlockPolicy,
        scene_end_ids: &[SegmentId],
        scene_snapshot_hash: SourceHash,
        terms: &ApprovedTerms,
    ) -> Result<Self, Box<dyn Error>> {
        if format != Self::SRT_FORMAT {
            return Err("scene maps require SRT source".into());
        }
        Ok(Self::Srt(SrtRunPlan::with_scene_map_and_terms(
            source,
            translation_id,
            run_id,
            pair,
            policy,
            scene_end_ids,
            scene_snapshot_hash,
            terms,
        )?))
    }

    pub fn source_format(&self) -> &'static str {
        match self {
            Self::Srt(_) => Self::SRT_FORMAT,
            Self::Vtt(_) => Self::VTT_FORMAT,
        }
    }

    pub fn with_name_registry(
        self,
        registry: &auralis_translation::NameRegistry,
        scene_end_ids: &[SegmentId],
    ) -> Result<Self, Box<dyn Error>> {
        match self {
            Self::Srt(plan) => Ok(Self::Srt(plan.with_name_registry(registry, scene_end_ids)?)),
            Self::Vtt(_) => Err("experimental name registry requires SRT".into()),
        }
    }

    pub fn source_hash(&self) -> SourceHash {
        match self {
            Self::Srt(plan) => plan.source_hash(),
            Self::Vtt(plan) => plan.source_hash(),
        }
    }

    pub fn source_len(&self) -> usize {
        match self {
            Self::Srt(plan) => plan.source_len(),
            Self::Vtt(plan) => plan.source_len(),
        }
    }

    pub fn parser_version(&self) -> u32 {
        match self {
            Self::Srt(_) => SrtRunPlan::PARSER_VERSION,
            Self::Vtt(_) => VttRunPlan::PARSER_VERSION,
        }
    }

    pub fn policy_fingerprint(&self, policy: BlockPolicy) -> SourceHash {
        match self {
            Self::Srt(plan) => plan.policy_fingerprint_for_run(policy),
            Self::Vtt(_) => VttRunPlan::policy_fingerprint(policy),
        }
    }

    pub fn blocks(&self) -> &[Vec<SegmentId>] {
        match self {
            Self::Srt(plan) => plan.blocks(),
            Self::Vtt(plan) => plan.blocks(),
        }
    }

    pub fn block_fingerprints(&self) -> Vec<SourceHash> {
        match self {
            Self::Srt(plan) => plan.block_fingerprints(),
            Self::Vtt(plan) => plan.block_fingerprints(),
        }
    }

    pub fn execute_with_policy(
        &self,
        provider: &LlamaCppProvider,
        store: &mut TranslateDb,
        progress: &mut impl ProgressSink,
        control: &TranslateDb,
        retry: RetryPolicy,
    ) -> Result<Vec<u8>, DocumentRunError> {
        match self {
            Self::Srt(plan) => plan
                .execute_with_policy(provider, store, progress, control, retry)
                .map_err(|error| match error {
                    paused @ SrtRunError::Translate(
                        auralis_translation::TranslateRunError::Paused,
                    ) => DocumentRunError::Paused(Box::new(paused)),
                    other => DocumentRunError::Failed(Box::new(other)),
                }),
            Self::Vtt(plan) => plan
                .execute_with_policy(provider, store, progress, control, retry)
                .map_err(|error| match error {
                    paused @ VttRunError::Translate(
                        auralis_translation::TranslateRunError::Paused,
                    ) => DocumentRunError::Paused(Box::new(paused)),
                    other => DocumentRunError::Failed(Box::new(other)),
                }),
        }
    }
}

impl VerifiedRenderer for DocumentRunPlan {
    type Error = DocumentRenderError;

    fn source_hash(&self) -> SourceHash {
        DocumentRunPlan::source_hash(self)
    }

    fn render_selected(&self, selected: &[TargetSegment]) -> Result<Vec<u8>, Self::Error> {
        match self {
            Self::Srt(plan) => plan
                .render_selected(selected)
                .map_err(DocumentRenderError::Srt),
            Self::Vtt(plan) => plan
                .render_selected(selected)
                .map_err(DocumentRenderError::Vtt),
        }
    }

    fn structural_evidence(&self) -> &'static str {
        match self {
            Self::Srt(_) => SrtRunPlan::STRUCTURAL_EVIDENCE,
            Self::Vtt(_) => VttRunPlan::STRUCTURAL_EVIDENCE,
        }
    }
}
use crate::document_render_error::DocumentRenderError;
