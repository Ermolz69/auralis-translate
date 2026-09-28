use crate::{
    ApprovedTerms, BlockPolicy, ContractError, Glossary, LanguagePair, RunId, SceneMap, SegmentId,
    SourceHash, SourceSegment, TranslationBatch, TranslationId,
};
use std::collections::HashSet;
use std::ops::Range;

pub struct PlannedBatches {
    batches: Vec<TranslationBatch>,
    ids: Vec<Vec<SegmentId>>,
}

impl PlannedBatches {
    pub fn new(
        segments: &[SourceSegment],
        translation_id: TranslationId,
        run_id: RunId,
        source_hash: SourceHash,
        pair: LanguagePair,
        policy: BlockPolicy,
        glossary: Option<&Glossary>,
    ) -> Result<Self, ContractError> {
        Self::validate(segments, glossary)?;
        let whole_file = 0..segments.len();
        Self::build(
            segments,
            std::slice::from_ref(&whole_file),
            translation_id,
            run_id,
            source_hash,
            pair,
            policy,
            glossary,
            None,
        )
    }

    #[allow(clippy::too_many_arguments)]
    pub fn with_scenes(
        segments: &[SourceSegment],
        scene_map: &SceneMap,
        translation_id: TranslationId,
        run_id: RunId,
        source_hash: SourceHash,
        pair: LanguagePair,
        policy: BlockPolicy,
        glossary: Option<&Glossary>,
    ) -> Result<Self, ContractError> {
        Self::validate(segments, glossary)?;
        if !scene_map.matches(segments) {
            return Err(ContractError::InvalidSceneMap);
        }
        Self::build(
            segments,
            scene_map.ranges(),
            translation_id,
            run_id,
            source_hash,
            pair,
            policy,
            glossary,
            None,
        )
    }

    #[allow(clippy::too_many_arguments)]
    pub fn with_scenes_and_terms(
        segments: &[SourceSegment],
        scene_map: &SceneMap,
        translation_id: TranslationId,
        run_id: RunId,
        source_hash: SourceHash,
        pair: LanguagePair,
        policy: BlockPolicy,
        terms: &ApprovedTerms,
    ) -> Result<Self, ContractError> {
        Self::validate(segments, None)?;
        if !scene_map.matches(segments) {
            return Err(ContractError::InvalidSceneMap);
        }
        terms.validate_against(segments)?;
        Self::build(
            segments,
            scene_map.ranges(),
            translation_id,
            run_id,
            source_hash,
            pair,
            policy,
            None,
            Some(terms),
        )
    }

    fn validate(
        segments: &[SourceSegment],
        glossary: Option<&Glossary>,
    ) -> Result<(), ContractError> {
        if segments.is_empty() {
            return Err(ContractError::EmptyTargets);
        }
        let mut segment_ids = HashSet::with_capacity(segments.len());
        if segments
            .iter()
            .any(|segment| !segment_ids.insert(segment.id()))
        {
            return Err(ContractError::DuplicateSegmentId);
        }
        if glossary.is_some_and(|glossary| {
            glossary.entries().iter().any(|entry| {
                entry
                    .segment_ids()
                    .is_some_and(|ids| ids.iter().any(|id| !segment_ids.contains(id)))
            })
        }) {
            return Err(ContractError::InvalidGlossary);
        }
        Ok(())
    }

    #[allow(clippy::too_many_arguments)]
    fn build(
        segments: &[SourceSegment],
        ranges: &[Range<usize>],
        translation_id: TranslationId,
        run_id: RunId,
        source_hash: SourceHash,
        pair: LanguagePair,
        policy: BlockPolicy,
        glossary: Option<&Glossary>,
        approved_terms: Option<&ApprovedTerms>,
    ) -> Result<Self, ContractError> {
        let mut batches = Vec::new();
        let mut ids = Vec::new();
        for scene in ranges {
            for (block_index, targets) in segments[scene.clone()]
                .chunks(policy.max_target_segments())
                .enumerate()
            {
                let start = scene.start + block_index * policy.max_target_segments();
                let end = start + targets.len();
                let before = start
                    .saturating_sub(policy.context_before_segments())
                    .max(scene.start);
                let after = end
                    .saturating_add(policy.context_after_segments())
                    .min(scene.end);
                let context = segments[before..start]
                    .iter()
                    .chain(&segments[end..after])
                    .cloned()
                    .collect::<Vec<_>>();
                let applied_glossary = glossary
                    .map(|glossary| glossary.applicable(targets, &context))
                    .unwrap_or_default();
                let batch = if let Some(terms) = approved_terms {
                    TranslationBatch::with_approved_terms(
                        translation_id,
                        run_id,
                        source_hash,
                        pair,
                        targets.to_vec(),
                        context,
                        terms.applicable(targets),
                    )?
                } else {
                    TranslationBatch::with_glossary(
                        translation_id,
                        run_id,
                        source_hash,
                        pair,
                        targets.to_vec(),
                        context,
                        applied_glossary,
                    )?
                };
                ids.push(targets.iter().map(SourceSegment::id).collect());
                batches.push(batch);
            }
        }
        Ok(Self { batches, ids })
    }

    pub fn batches(&self) -> &[TranslationBatch] {
        &self.batches
    }
    pub fn ids(&self) -> &[Vec<SegmentId>] {
        &self.ids
    }
    pub fn fingerprints(&self) -> Vec<SourceHash> {
        self.batches
            .iter()
            .map(TranslationBatch::fingerprint)
            .collect()
    }
}
