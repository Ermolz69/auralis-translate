use crate::migrations;
use crate::repositories::{
    attempt_repository, checkpoint_repository, result_repository, run_repository,
    translation_repository,
};
use crate::{
    AttemptId, CheckpointSpec, DbError, ResultRecord, ResultSpec, RunSpec, RunStop, SqliteConfig,
    TranslationSpec,
};
use auralis_translation::{ResultId, RunId, RunState, TranslationId, VerifiedRenderer};
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

    pub fn begin_attempt(
        &mut self,
        run: &RunSpec,
        host_job_id: Option<&str>,
    ) -> Result<AttemptId, DbError> {
        self.ensure_run(run)?;
        attempt_repository::begin(&mut self.connection, run.run_id, host_job_id)
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

    pub fn run_state(&self, run_id: RunId) -> Result<RunState, DbError> {
        attempt_repository::state(&self.connection, run_id)
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
}
