mod support;

use auralis_translation::{
    BlockCheckpoint, CheckpointStore, ProgressSink, RunId, RunProgress,
    translate_planned_run_with_progress,
};
use std::{error::Error, io};
use support::{EchoProvider, sample_batch};

struct RecordingProgress(Vec<RunProgress>);

impl ProgressSink for RecordingProgress {
    fn report(&mut self, progress: RunProgress) {
        self.0.push(progress);
    }
}

struct FailingCommitStore;

impl CheckpointStore for FailingCommitStore {
    type Error = io::Error;

    fn load(&self, _: RunId) -> Result<Vec<BlockCheckpoint>, Self::Error> {
        Ok(Vec::new())
    }

    fn commit(&mut self, _: &BlockCheckpoint) -> Result<(), Self::Error> {
        Err(io::Error::other("injected disk failure"))
    }
}

#[test]
fn failed_checkpoint_commit_never_reports_the_block_as_saved() -> Result<(), Box<dyn Error>> {
    let batch = sample_batch()?;
    let mut progress = RecordingProgress(Vec::new());
    let result = translate_planned_run_with_progress(
        &EchoProvider,
        &mut FailingCommitStore,
        &[batch.targets().iter().map(|target| target.id()).collect()],
        std::slice::from_ref(&batch),
        &mut progress,
    );

    assert!(result.is_err());
    assert_eq!(
        progress.0,
        vec![RunProgress {
            run_id: batch.run_id(),
            committed_blocks: 0,
            total_blocks: 1,
        }]
    );
    Ok(())
}
