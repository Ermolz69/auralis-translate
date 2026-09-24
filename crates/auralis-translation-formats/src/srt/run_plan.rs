use super::{SegmentTranslation, SrtBlockPolicy, SrtDocument, SrtPlanError, SrtRunError};
use crate::inspect;
use auralis_translation::{
    CheckpointStore, LanguagePair, RunId, SegmentId, SourceHash, TargetSegment, TranslationBatch,
    TranslationId, TranslationProvider, translate_planned_run,
};

pub struct SrtRunPlan {
    document: SrtDocument,
    batches: Vec<TranslationBatch>,
    planned_ids: Vec<Vec<SegmentId>>,
    source_hash: SourceHash,
}

impl SrtRunPlan {
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

    pub fn blocks(&self) -> &[Vec<SegmentId>] {
        &self.planned_ids
    }

    pub fn block_fingerprints(&self) -> Vec<SourceHash> {
        self.batches
            .iter()
            .map(TranslationBatch::fingerprint)
            .collect()
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
