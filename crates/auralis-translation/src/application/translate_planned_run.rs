use super::{TranslateRunError, diagnose_batch::diagnose_batch, translate_batch_with_control};
use crate::domain::valid_line;
use crate::{
    BlockCheckpoint, CheckpointStore, ProgressSink, RetryPolicy, RunControl, RunId, RunProgress,
    SegmentId, TargetSegment, TranslationBatch, TranslationProvider,
};
use std::collections::{HashMap, HashSet};

pub fn translate_planned_run<S: CheckpointStore>(
    provider: &impl TranslationProvider,
    store: &mut S,
    planned_ids: &[Vec<SegmentId>],
    batches: &[TranslationBatch],
) -> Result<Vec<TargetSegment>, TranslateRunError<S::Error>> {
    translate_planned_run_with_progress(provider, store, planned_ids, batches, &mut NoopProgress)
}

struct NoopProgress;

impl ProgressSink for NoopProgress {
    fn report(&mut self, _: RunProgress) {}
}

pub fn translate_planned_run_with_progress<S: CheckpointStore>(
    provider: &impl TranslationProvider,
    store: &mut S,
    planned_ids: &[Vec<SegmentId>],
    batches: &[TranslationBatch],
    progress: &mut impl ProgressSink,
) -> Result<Vec<TargetSegment>, TranslateRunError<S::Error>> {
    translate_planned_run_with_control(
        provider,
        store,
        planned_ids,
        batches,
        progress,
        &NoRunControl,
    )
}

struct NoRunControl;

impl RunControl for NoRunControl {
    fn pause_requested(&self, _: RunId) -> Result<bool, Box<dyn std::error::Error>> {
        Ok(false)
    }
}

pub fn translate_planned_run_with_control<S: CheckpointStore>(
    provider: &impl TranslationProvider,
    store: &mut S,
    planned_ids: &[Vec<SegmentId>],
    batches: &[TranslationBatch],
    progress: &mut impl ProgressSink,
    control: &impl RunControl,
) -> Result<Vec<TargetSegment>, TranslateRunError<S::Error>> {
    translate_planned_run_with_policy(
        provider,
        store,
        planned_ids,
        batches,
        progress,
        control,
        RetryPolicy::default(),
    )
}

pub fn translate_planned_run_with_policy<S: CheckpointStore>(
    provider: &impl TranslationProvider,
    store: &mut S,
    planned_ids: &[Vec<SegmentId>],
    batches: &[TranslationBatch],
    progress: &mut impl ProgressSink,
    control: &impl RunControl,
    retry: RetryPolicy,
) -> Result<Vec<TargetSegment>, TranslateRunError<S::Error>> {
    if planned_ids.is_empty() || planned_ids.len() != batches.len() {
        return Err(TranslateRunError::InvalidPlan(
            "block count differs from frozen plan",
        ));
    }
    let first = batches
        .first()
        .ok_or(TranslateRunError::InvalidPlan("no blocks"))?;
    let mut target_ids = HashSet::new();
    for (expected_ids, batch) in planned_ids.iter().zip(batches) {
        if expected_ids.is_empty()
            || expected_ids.as_slice()
                != batch
                    .targets()
                    .iter()
                    .map(|segment| segment.id())
                    .collect::<Vec<_>>()
        {
            return Err(TranslateRunError::InvalidPlan(
                "block target IDs differ from frozen plan",
            ));
        }
        if batch.translation_id() != first.translation_id()
            || batch.run_id() != first.run_id()
            || batch.source_hash() != first.source_hash()
            || batch.language_pair() != first.language_pair()
        {
            return Err(TranslateRunError::InvalidPlan(
                "blocks disagree on frozen run identity",
            ));
        }
        if batch
            .targets()
            .iter()
            .any(|segment| !target_ids.insert(segment.id()))
        {
            return Err(TranslateRunError::InvalidPlan(
                "target ID occurs in more than one block",
            ));
        }
    }
    let loaded = store
        .load(first.run_id())
        .map_err(TranslateRunError::Store)?;
    let mut checkpoints = HashMap::new();
    for checkpoint in loaded {
        let index = checkpoint.block_index as usize;
        let batch = batches
            .get(index)
            .ok_or(TranslateRunError::InvalidCheckpoint(
                "checkpoint lies outside the run plan",
            ))?;
        validate_checkpoint(batch, &checkpoint)?;
        if checkpoints.insert(index, checkpoint).is_some() {
            return Err(TranslateRunError::InvalidCheckpoint(
                "duplicate saved block",
            ));
        }
    }
    let mut committed_blocks = checkpoints.len();
    progress.report(RunProgress {
        run_id: first.run_id(),
        committed_blocks,
        total_blocks: batches.len(),
    });
    let mut accepted = Vec::with_capacity(target_ids.len());
    for (index, batch) in batches.iter().enumerate() {
        let checkpoint = if let Some(checkpoint) = checkpoints.remove(&index) {
            checkpoint
        } else {
            let mut attempt_count = 0;
            let translated = loop {
                check_pause(control, first.run_id())?;
                attempt_count += 1;
                let translated = translate_batch_with_control(provider, batch, control);
                check_pause(control, first.run_id())?;
                match translated {
                    Ok(translated) => break translated,
                    Err(_) if attempt_count < retry.max_attempts() => continue,
                    Err(error) => return Err(TranslateRunError::Batch(error)),
                }
            };
            check_pause(control, first.run_id())?;
            let block_index = u32::try_from(index)
                .map_err(|_| TranslateRunError::InvalidPlan("too many blocks"))?;
            let checkpoint = BlockCheckpoint {
                run_id: batch.run_id(),
                block_index,
                input_fingerprint: batch.fingerprint(),
                diagnostics: diagnose_batch(batch, &translated),
                accepted: translated,
                attempt_count,
            };
            store
                .commit(&checkpoint)
                .map_err(TranslateRunError::Store)?;
            committed_blocks += 1;
            progress.report(RunProgress {
                run_id: first.run_id(),
                committed_blocks,
                total_blocks: batches.len(),
            });
            checkpoint
        };
        accepted.extend(checkpoint.accepted);
    }
    check_pause(control, first.run_id())?;
    Ok(accepted)
}

fn check_pause<E>(control: &impl RunControl, run_id: RunId) -> Result<(), TranslateRunError<E>> {
    if control
        .pause_requested(run_id)
        .map_err(TranslateRunError::Control)?
    {
        return Err(TranslateRunError::Paused);
    }
    Ok(())
}

fn validate_checkpoint<E>(
    batch: &TranslationBatch,
    checkpoint: &BlockCheckpoint,
) -> Result<(), TranslateRunError<E>> {
    if checkpoint.run_id != batch.run_id()
        || checkpoint.input_fingerprint != batch.fingerprint()
        || checkpoint.attempt_count == 0
        || checkpoint.accepted.len() != batch.targets().len()
    {
        return Err(TranslateRunError::InvalidCheckpoint(
            "saved block does not match frozen input",
        ));
    }
    for (source, target) in batch.targets().iter().zip(&checkpoint.accepted) {
        if source.id() != target.id
            || source.lines().len() != target.lines.len()
            || target.lines.iter().any(|line| !valid_line(line))
        {
            return Err(TranslateRunError::InvalidCheckpoint(
                "saved text does not match target slots",
            ));
        }
    }
    if checkpoint.diagnostics.iter().any(|diagnostic| {
        !batch.targets().iter().any(|segment| {
            segment.id() == diagnostic.segment_id
                && usize::try_from(diagnostic.line_index)
                    .is_ok_and(|index| index < segment.lines().len())
        })
    }) {
        return Err(TranslateRunError::InvalidCheckpoint(
            "saved diagnostic lies outside target lines",
        ));
    }
    Ok(())
}
