use crate::repositories::{
    attempt_admission, attempt_repository, checkpoint_repository, edit_commit, edit_provenance,
    edit_selection, inference_request_repository, model_preflight_repository, project_cleanup,
    result_repository, run_repository, segment_repository, translation_repository,
};
use crate::{
    AttemptId, AttemptStartGuard, BranchEditSpec, CheckpointSpec, DbError, EditProvenance,
    EditSelection, EditSpec, InferenceRequestRecord, ModelPreflightOutcome, ResultRecord,
    ResultSpec, RunDiagnostic, RunSpec, RunStop, SegmentSpec, SqliteConfig, TranslationSpec,
};
use crate::{diagnostic_codec, migrations};
use auralis_translation::{
    InferenceRequestFinish, InferenceRequestStart, ResultId, RunControl, RunId, RunState,
    TranslationId, VerifiedRenderer,
};
use rusqlite::Connection;
use std::path::Path;

pub struct TranslateDb {
    connection: Connection,
}

impl TranslateDb {
    pub fn open(path: &Path, config: SqliteConfig) -> Result<Self, DbError> {
        let mut connection = Connection::open(path)?;
        connection.busy_timeout(config.busy_timeout())?;
        connection.pragma_update(None, "foreign_keys", true)?;
        connection.pragma_update(None, "journal_mode", "WAL")?;
        migrations::apply(&mut connection)?;
        Ok(Self { connection })
    }

    pub fn schema_version(&self) -> Result<u32, DbError> {
        Ok(self
            .connection
            .pragma_query_value(None, "user_version", |row| row.get(0))?)
    }

    pub fn ensure_translation(&mut self, spec: &TranslationSpec) -> Result<(), DbError> {
        translation_repository::ensure(&mut self.connection, spec)
    }

    pub fn translation(&self, translation_id: TranslationId) -> Result<TranslationSpec, DbError> {
        translation_repository::load(&self.connection, translation_id)
    }

    pub fn delete_project_translation(
        &mut self,
        translation_id: TranslationId,
        project_id: &str,
    ) -> Result<bool, DbError> {
        project_cleanup::delete(&mut self.connection, translation_id, project_id)
    }

    pub fn ensure_segments(
        &mut self,
        translation_id: TranslationId,
        source_len: u64,
        segments: &[SegmentSpec],
    ) -> Result<(), DbError> {
        segment_repository::ensure(&mut self.connection, translation_id, source_len, segments)
    }

    pub fn segments(&self, translation_id: TranslationId) -> Result<Vec<SegmentSpec>, DbError> {
        segment_repository::load(&self.connection, translation_id)
    }

    pub fn ensure_run(&mut self, spec: &RunSpec) -> Result<(), DbError> {
        run_repository::ensure(&mut self.connection, spec)
    }

    pub fn run(&self, run_id: RunId) -> Result<RunSpec, DbError> {
        run_repository::load(&self.connection, run_id)
    }

    pub fn commit_checkpoint(&mut self, spec: &CheckpointSpec) -> Result<(), DbError> {
        checkpoint_repository::commit(&mut self.connection, spec)
    }

    pub fn checkpoints(&self, run_id: RunId) -> Result<Vec<CheckpointSpec>, DbError> {
        checkpoint_repository::load(&self.connection, run_id)
    }

    pub fn begin_inference_request(
        &mut self,
        attempt_id: AttemptId,
        start: &InferenceRequestStart,
    ) -> Result<(), DbError> {
        inference_request_repository::begin(&mut self.connection, attempt_id, start)
    }

    pub fn finish_inference_request(
        &mut self,
        finish: &InferenceRequestFinish,
    ) -> Result<(), DbError> {
        inference_request_repository::finish(&mut self.connection, finish)
    }

    pub fn inference_requests(
        &self,
        run_id: RunId,
    ) -> Result<Vec<InferenceRequestRecord>, DbError> {
        inference_request_repository::load(&self.connection, run_id)
    }

    pub fn diagnostics(&self, run_id: RunId) -> Result<Vec<RunDiagnostic>, DbError> {
        let mut result = Vec::new();
        for checkpoint in self.checkpoints(run_id)? {
            for diagnostic in diagnostic_codec::decode(&checkpoint.diagnostics_json)? {
                result.push(RunDiagnostic {
                    block_index: checkpoint.block_index,
                    diagnostic,
                });
            }
        }
        Ok(result)
    }

    pub fn begin_attempt(
        &mut self,
        run: &RunSpec,
        host_job_id: Option<&str>,
    ) -> Result<AttemptId, DbError> {
        self.ensure_run(run)?;
        attempt_repository::begin(&mut self.connection, run.run_id, host_job_id, false, None)
    }

    pub fn begin_initial_attempt(
        &mut self,
        run: &RunSpec,
        host_job_id: Option<&str>,
    ) -> Result<AttemptId, DbError> {
        self.ensure_run(run)?;
        attempt_repository::begin(&mut self.connection, run.run_id, host_job_id, true, None)
    }

    pub fn capture_attempt_start(&self, run_id: RunId) -> Result<AttemptStartGuard, DbError> {
        attempt_admission::capture(&self.connection, run_id)
    }

    pub fn check_attempt_start(&self, guard: AttemptStartGuard) -> Result<(), DbError> {
        attempt_admission::check(&self.connection, guard)
    }

    pub fn begin_model_preflight(&mut self, guard: AttemptStartGuard) -> Result<i64, DbError> {
        model_preflight_repository::begin(&mut self.connection, guard)
    }

    pub fn finish_model_preflight(
        &self,
        run_id: RunId,
        diagnostic_id: i64,
        outcome: ModelPreflightOutcome,
        detail: &serde_json::Value,
    ) -> Result<(), DbError> {
        model_preflight_repository::finish(&self.connection, run_id, diagnostic_id, outcome, detail)
    }

    pub fn begin_guarded_attempt(
        &mut self,
        run: &RunSpec,
        host_job_id: Option<&str>,
        guard: AttemptStartGuard,
    ) -> Result<AttemptId, DbError> {
        if guard.run_id() != run.run_id {
            return Err(DbError::Conflict("admission guard belongs to another run"));
        }
        self.ensure_run(run)?;
        attempt_repository::begin(
            &mut self.connection,
            run.run_id,
            host_job_id,
            false,
            Some(guard),
        )
    }

    pub fn stop_attempt(
        &mut self,
        run_id: RunId,
        attempt_id: AttemptId,
        stop: RunStop,
        reason: &str,
    ) -> Result<(), DbError> {
        attempt_repository::stop(&mut self.connection, run_id, attempt_id, stop, reason)
    }

    pub fn recover_interrupted(&mut self, run_id: RunId) -> Result<bool, DbError> {
        attempt_repository::recover_interrupted(&mut self.connection, run_id)
    }

    pub fn recover_interrupted_for_host(
        &mut self,
        run_id: RunId,
        host_job_id: &str,
    ) -> Result<bool, DbError> {
        attempt_repository::recover_interrupted_for_host(&mut self.connection, run_id, host_job_id)
    }

    pub fn run_state(&self, run_id: RunId) -> Result<RunState, DbError> {
        attempt_repository::state(&self.connection, run_id)
    }

    pub fn request_pause(&self, run_id: RunId) -> Result<(), DbError> {
        attempt_repository::request_pause(&self.connection, run_id)
    }

    pub fn pause_requested(&self, run_id: RunId) -> Result<bool, DbError> {
        attempt_repository::pause_requested(&self.connection, run_id)
    }

    pub fn commit_result<V: VerifiedRenderer>(
        &mut self,
        spec: &ResultSpec,
        renderer: &V,
    ) -> Result<ResultRecord, DbError> {
        result_repository::commit(&mut self.connection, spec, renderer)
    }

    pub fn result(&self, result_id: ResultId) -> Result<ResultRecord, DbError> {
        result_repository::load(&self.connection, result_id)
    }

    pub fn result_for_run(&self, run_id: RunId) -> Result<ResultRecord, DbError> {
        result_repository::for_run(&self.connection, run_id)
    }

    pub fn commit_edit<V: VerifiedRenderer>(
        &mut self,
        spec: &EditSpec,
        renderer: &V,
    ) -> Result<ResultRecord, DbError> {
        edit_commit::run(&mut self.connection, spec, None, renderer)
    }

    pub fn commit_branch_edit<V: VerifiedRenderer>(
        &mut self,
        spec: &BranchEditSpec,
        renderer: &V,
    ) -> Result<ResultRecord, DbError> {
        edit_commit::run(
            &mut self.connection,
            &spec.edit,
            Some(spec.expected_head_result_id),
            renderer,
        )
    }

    pub fn result_edit_provenance(
        &self,
        result_id: ResultId,
    ) -> Result<Option<EditProvenance>, DbError> {
        edit_provenance::load(&self.connection, result_id)
    }

    pub fn result_edits(&self, result_id: ResultId) -> Result<Vec<EditSelection>, DbError> {
        let result = result_repository::load(&self.connection, result_id)?;
        let selections = edit_selection::load(&self.connection, result_id)?;
        for selection in &selections {
            let stored_text =
                edit_selection::text(&self.connection, result_id, selection.segment_id)?
                    .ok_or(DbError::CorruptRecord("selected edit text is missing"))?;
            if !result
                .selected
                .iter()
                .any(|segment| segment.id == selection.segment_id && segment.lines == stored_text)
            {
                return Err(DbError::CorruptRecord(
                    "selected edit differs from result text",
                ));
            }
        }
        Ok(selections)
    }
}

impl RunControl for TranslateDb {
    fn pause_requested(&self, run_id: RunId) -> Result<bool, Box<dyn std::error::Error>> {
        Ok(TranslateDb::pause_requested(self, run_id)?)
    }
}
