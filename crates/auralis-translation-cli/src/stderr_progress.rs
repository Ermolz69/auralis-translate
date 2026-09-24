use auralis_translation::{ProgressSink, RunProgress};

pub(crate) struct StderrProgress;

impl ProgressSink for StderrProgress {
    fn report(&mut self, progress: RunProgress) {
        eprintln!(
            "run_id={} saved_blocks={}/{}",
            progress.run_id, progress.committed_blocks, progress.total_blocks
        );
    }
}
