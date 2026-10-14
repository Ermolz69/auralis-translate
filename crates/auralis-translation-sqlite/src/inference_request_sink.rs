use crate::eval_journal_timing::{self, PhaseTimer};
use crate::{AttemptId, DbError, SqliteConfig, TranslateDb};
use auralis_translation::{InferenceRequestFinish, InferenceRequestJournal, InferenceRequestStart};
use std::error::Error;
use std::path::Path;
use std::path::PathBuf;
use std::sync::Mutex;

pub struct SqliteInferenceRequestSink {
    database: Mutex<TranslateDb>,
    attempt_id: AttemptId,
    path: PathBuf,
}

impl SqliteInferenceRequestSink {
    pub fn open(path: &Path, config: SqliteConfig, attempt_id: AttemptId) -> Result<Self, DbError> {
        let database = TranslateDb::open(path, config)?;
        if eval_journal_timing::enabled() {
            let conn = &database.connection;
            let mode: String = conn.pragma_query_value(None, "journal_mode", |row| row.get(0))?;
            let synchronous: i64 =
                conn.pragma_query_value(None, "synchronous", |row| row.get(0))?;
            let autocheckpoint: i64 =
                conn.pragma_query_value(None, "wal_autocheckpoint", |row| row.get(0))?;
            let page_size: i64 = conn.pragma_query_value(None, "page_size", |row| row.get(0))?;
            let busy_timeout: i64 =
                conn.pragma_query_value(None, "busy_timeout", |row| row.get(0))?;
            eprintln!(
                "auralis_eval_journal_config {{\"schema_version\":1,\"journal_mode\":\"{mode}\",\"synchronous\":{synchronous},\"wal_autocheckpoint\":{autocheckpoint},\"page_size\":{page_size},\"busy_timeout_ms\":{busy_timeout}}}"
            );
        }
        Ok(Self {
            database: Mutex::new(database),
            attempt_id,
            path: path.to_path_buf(),
        })
    }
}

impl InferenceRequestJournal for SqliteInferenceRequestSink {
    fn begin(&self, start: &InferenceRequestStart) -> Result<(), Box<dyn Error + Send + Sync>> {
        let mut db = self
            .database
            .lock()
            .map_err(|_| DbError::Conflict("inference journal lock poisoned"))?;
        db.begin_inference_request(self.attempt_id, start)?;
        Ok(())
    }

    fn finish(&self, finish: &InferenceRequestFinish) -> Result<(), Box<dyn Error + Send + Sync>> {
        eval_journal_timing::with_operation(|| {
            let wait = PhaseTimer::new("mutex_wait");
            let mut db = self
                .database
                .lock()
                .map_err(|_| DbError::Conflict("inference journal lock poisoned"))?;
            drop(wait);
            let observe_wal =
                std::env::var_os("AURALIS_EVAL_JOURNAL_WAL").is_some_and(|value| value == "1");
            if observe_wal {
                let timer = PhaseTimer::new("wal_probe_before");
                eval_journal_timing::wal_snapshot(&self.path, "wal_before");
                drop(timer);
            }
            let result = db.finish_inference_request(finish);
            if observe_wal {
                let timer = PhaseTimer::new("wal_probe_after");
                eval_journal_timing::wal_snapshot(&self.path, "wal_after");
                drop(timer);
            }
            result?;
            Ok(())
        })
    }
}
