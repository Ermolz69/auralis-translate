mod support;

use auralis_translation::{
    BlockCheckpoint, CheckpointStore, ProgressSink, ProviderError, ProviderResponse, RetryPolicy,
    RunControl, RunId, RunProgress, TargetSegment, TranslateBatchError, TranslateRunError,
    TranslationBatch, TranslationProvider, translate_planned_run_with_policy,
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
            return Err(ProviderError::Transient("injected provider failure".into()));
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

#[test]
fn permanent_provider_failure_is_not_retried_or_checkpointed() -> Result<(), Box<dyn Error>> {
    struct PermanentFailure(Cell<u32>);
    impl TranslationProvider for PermanentFailure {
        fn translate(&self, batch: &TranslationBatch) -> Result<ProviderResponse, ProviderError> {
            self.0.set(self.0.get() + 1);
            if self.0.get() == 1 {
                Err(ProviderError::Permanent("invalid model response".into()))
            } else {
                EchoProvider.translate(batch)
            }
        }
    }

    let batch = sample_batch()?;
    let planned = vec![batch.targets().iter().map(|target| target.id()).collect()];
    let provider = PermanentFailure(Cell::new(0));
    let mut store = MemoryStore::default();
    let mut progress = Progress::default();
    let result = translate_planned_run_with_policy(
        &provider,
        &mut store,
        &planned,
        std::slice::from_ref(&batch),
        &mut progress,
        &NoPause,
        RetryPolicy::new(3).ok_or("invalid retry policy")?,
    );
    assert!(matches!(
        result,
        Err(TranslateRunError::Batch(TranslateBatchError::Provider(
            ProviderError::Permanent(_)
        )))
    ));
    assert_eq!(provider.0.get(), 1);
    assert!(store.0.is_empty());
    assert_eq!(progress.0.len(), 1);
    Ok(())
}

#[derive(Clone, Copy)]
enum InvalidShape {
    Missing,
    Duplicate,
    ExtraContextId,
    EmptyText,
}

struct InvalidThenEcho {
    calls: Cell<u32>,
    shape: InvalidShape,
}

impl TranslationProvider for InvalidThenEcho {
    fn translate(&self, batch: &TranslationBatch) -> Result<ProviderResponse, ProviderError> {
        self.calls.set(self.calls.get() + 1);
        let mut response = EchoProvider.translate(batch)?;
        if self.calls.get() == 1 {
            match self.shape {
                InvalidShape::Missing => {
                    response.translations.pop();
                }
                InvalidShape::Duplicate => {
                    response.translations.push(response.translations[0].clone());
                }
                InvalidShape::ExtraContextId => {
                    response.translations.push(TargetSegment {
                        id: batch.context()[0].id(),
                        lines: vec!["вне цели".into()],
                    });
                }
                InvalidShape::EmptyText => response.translations[0].lines[0].clear(),
            }
        }
        Ok(response)
    }
}

#[test]
fn invalid_slot_mapping_is_not_retried_or_checkpointed() -> Result<(), Box<dyn Error>> {
    let batch = sample_batch()?;
    let planned = vec![batch.targets().iter().map(|target| target.id()).collect()];
    for shape in [
        InvalidShape::Missing,
        InvalidShape::Duplicate,
        InvalidShape::ExtraContextId,
        InvalidShape::EmptyText,
    ] {
        let provider = InvalidThenEcho {
            calls: Cell::new(0),
            shape,
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
        assert!(matches!(
            result,
            Err(TranslateRunError::Batch(TranslateBatchError::Contract(_)))
        ));
        assert_eq!(provider.calls.get(), 1);
        assert!(store.0.is_empty());
        assert_eq!(progress.0.len(), 1);
        assert_eq!(progress.0[0].committed_blocks, 0);
    }
    Ok(())
}

struct PauseOnProviderReturn(Cell<bool>);

impl RunControl for PauseOnProviderReturn {
    fn pause_requested(&self, _: RunId) -> Result<bool, Box<dyn Error>> {
        Ok(self.0.get())
    }
}

struct InterruptedProvider<'a> {
    control: &'a PauseOnProviderReturn,
    calls: Cell<u32>,
    fail: bool,
}

impl TranslationProvider for InterruptedProvider<'_> {
    fn translate(&self, _: &TranslationBatch) -> Result<ProviderResponse, ProviderError> {
        Err(ProviderError::Permanent(
            "uncontrolled provider path was used".into(),
        ))
    }

    fn translate_with_control(
        &self,
        batch: &TranslationBatch,
        _: &dyn RunControl,
    ) -> Result<ProviderResponse, ProviderError> {
        self.calls.set(self.calls.get() + 1);
        self.control.0.set(true);
        if self.fail {
            Err(ProviderError::Permanent("interrupted request".into()))
        } else {
            EchoProvider.translate(batch)
        }
    }
}

#[test]
fn pause_wins_on_provider_success_or_error_including_final_retry() -> Result<(), Box<dyn Error>> {
    let batch = sample_batch()?;
    let planned = vec![batch.targets().iter().map(|target| target.id()).collect()];
    for fail in [false, true] {
        for attempts in [1, 2] {
            let control = PauseOnProviderReturn(Cell::new(false));
            let provider = InterruptedProvider {
                control: &control,
                calls: Cell::new(0),
                fail,
            };
            let mut store = MemoryStore::default();
            let mut progress = Progress::default();
            let result = translate_planned_run_with_policy(
                &provider,
                &mut store,
                &planned,
                std::slice::from_ref(&batch),
                &mut progress,
                &control,
                RetryPolicy::new(attempts).ok_or("invalid policy")?,
            );
            assert!(matches!(result, Err(TranslateRunError::Paused)));
            assert_eq!(provider.calls.get(), 1);
            assert!(store.0.is_empty());
            assert_eq!(progress.0.len(), 1);
        }
    }
    Ok(())
}
