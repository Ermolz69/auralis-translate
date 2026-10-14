use auralis_translation::{
    BlockCheckpoint, CheckpointStore, InferenceRequestFinish, InferenceRequestJournal,
    InferenceRequestStart, RunId,
};
use auralis_translation_sqlite::{DbError, SqliteInferenceRequestSink, TranslateDb};
use std::error::Error;
use std::time::Instant;

const ENVIRONMENT_FLAG: &str = "AURALIS_EVAL_TIMINGS";
const LINE_PREFIX: &str = "auralis_eval_timing ";

pub(crate) fn enabled() -> bool {
    std::env::var_os(ENVIRONMENT_FLAG).is_some_and(|value| value == "1")
}

pub(crate) fn record(phase: &'static str, start: Instant, succeeded: bool) {
    if !enabled() {
        return;
    }
    let line = serde_json::json!({
        "schema_version": 1,
        "phase": phase,
        "elapsed_us": u64::try_from(start.elapsed().as_micros()).unwrap_or(u64::MAX),
        "outcome": if succeeded { "ok" } else { "failed" },
    });
    eprintln!("{LINE_PREFIX}{line}");
}

pub(crate) struct TimedCheckpointStore<'a> {
    inner: &'a mut TranslateDb,
}

impl<'a> TimedCheckpointStore<'a> {
    pub(crate) fn new(inner: &'a mut TranslateDb) -> Self {
        Self { inner }
    }
}

impl CheckpointStore for TimedCheckpointStore<'_> {
    type Error = DbError;

    fn load(&self, run_id: RunId) -> Result<Vec<BlockCheckpoint>, Self::Error> {
        let start = Instant::now();
        let result = self.inner.load(run_id);
        record("checkpoint_load", start, result.is_ok());
        result
    }

    fn commit(&mut self, checkpoint: &BlockCheckpoint) -> Result<(), Self::Error> {
        let start = Instant::now();
        let result = self.inner.commit(checkpoint);
        record("checkpoint_commit", start, result.is_ok());
        result
    }
}

pub(crate) struct TimedInferenceJournal {
    inner: SqliteInferenceRequestSink,
}

impl TimedInferenceJournal {
    pub(crate) fn new(inner: SqliteInferenceRequestSink) -> Self {
        Self { inner }
    }
}

impl InferenceRequestJournal for TimedInferenceJournal {
    fn begin(
        &self,
        start_request: &InferenceRequestStart,
    ) -> Result<(), Box<dyn Error + Send + Sync>> {
        let start = Instant::now();
        let result = self.inner.begin(start_request);
        record("journal_begin", start, result.is_ok());
        result
    }

    fn finish(&self, finish: &InferenceRequestFinish) -> Result<(), Box<dyn Error + Send + Sync>> {
        let start = Instant::now();
        let result = self.inner.finish(finish);
        record("journal_finish", start, result.is_ok());
        result
    }
}
