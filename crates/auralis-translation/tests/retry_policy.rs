mod support;

use auralis_translation::{
    BlockCheckpoint, CheckpointStore, ProgressSink, ProviderError, ProviderResponse, RetryPolicy,
    RunControl, RunId, RunProgress, TranslationBatch, TranslationProvider,
    translate_planned_run_with_policy,
};
use std::{cell::Cell, error::Error, io};
use support::{EchoProvider, sample_batch};

struct FailThenEcho {
    calls: Cell<u32>,
    fail_until: u32,
}

impl TranslationProvider for FailThenEcho {
    fn translate(&self, batch: &TranslationBatch) -> Result<ProviderResponse, ProviderError> {
        let call = self.calls.get() + 1;
        self.calls.set(call);
        if call <= self.fail_until {
            return Err(ProviderError("injected provider failure".into()));
        }
        EchoProvider.translate(batch)
    }
}

#[derive(Default)]
struct MemoryStore(Vec<BlockCheckpoint>);

impl CheckpointStore for MemoryStore {
    type Error = io::Error;

    fn load(&self, _: RunId) -> Result<Vec<BlockCheckpoint>, Self::Error> {
        Ok(self.0.clone())
    }

    fn commit(&mut self, checkpoint: &BlockCheckpoint) -> Result<(), Self::Error> {
        self.0.push(checkpoint.clone());
        Ok(())
    }
}

struct NoPause;

impl RunControl for NoPause {
    fn pause_requested(&self, _: RunId) -> Result<bool, Box<dyn Error>> {
        Ok(false)
    }
}

#[derive(Default)]
struct Progress(Vec<RunProgress>);

impl ProgressSink for Progress {
    fn report(&mut self, progress: RunProgress) {
        self.0.push(progress);
    }
}

#[test]
fn retries_only_uncommitted_block_and_records_actual_attempts() -> Result<(), Box<dyn Error>> {
    let batch = sample_batch()?;
    let planned = vec![batch.targets().iter().map(|target| target.id()).collect()];
    let provider = FailThenEcho {
        calls: Cell::new(0),
        fail_until: 1,
    };
    let mut store = MemoryStore::default();
    let mut progress = Progress::default();
    let accepted = translate_planned_run_with_policy(
        &provider,
        &mut store,
        &planned,
        std::slice::from_ref(&batch),
        &mut progress,
        &NoPause,
        RetryPolicy::new(2).ok_or("invalid retry policy")?,
    )?;
    assert_eq!(provider.calls.get(), 2);
    assert_eq!(accepted.len(), batch.targets().len());
    assert_eq!(store.0.len(), 1);
    assert_eq!(store.0[0].attempt_count, 2);
    assert_eq!(progress.0.len(), 2);
    assert_eq!(progress.0[0].committed_blocks, 0);
    assert_eq!(progress.0[1].committed_blocks, 1);
    Ok(())
}

#[test]
fn retry_budget_exhaustion_saves_no_checkpoint() -> Result<(), Box<dyn Error>> {
    let batch = sample_batch()?;
    let planned = vec![batch.targets().iter().map(|target| target.id()).collect()];
    let provider = FailThenEcho {
        calls: Cell::new(0),
        fail_until: 3,
    };
    let mut store = MemoryStore::default();
    let mut progress = Progress::default();
    let result = translate_planned_run_with_policy(
        &provider,
        &mut store,
        &planned,
        std::slice::from_ref(&batch),
        &mut progress,
        &NoPause,
        RetryPolicy::new(2).ok_or("invalid retry policy")?,
    );
    assert!(result.is_err());
    assert_eq!(provider.calls.get(), 2);
    assert!(store.0.is_empty());
    assert_eq!(progress.0.len(), 1);
    assert_eq!(progress.0[0].committed_blocks, 0);
    Ok(())
}
