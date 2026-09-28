use crate::{AttemptId, DbError, SqliteConfig, TranslateDb};
use auralis_translation::{InferenceRequestFinish, InferenceRequestJournal, InferenceRequestStart};
use std::error::Error;
use std::path::Path;
use std::sync::Mutex;

pub struct SqliteInferenceRequestSink {
    database: Mutex<TranslateDb>,
    attempt_id: AttemptId,
}

impl SqliteInferenceRequestSink {
    pub fn open(path: &Path, config: SqliteConfig, attempt_id: AttemptId) -> Result<Self, DbError> {
        Ok(Self {
            database: Mutex::new(TranslateDb::open(path, config)?),
            attempt_id,
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
        let mut db = self
            .database
            .lock()
            .map_err(|_| DbError::Conflict("inference journal lock poisoned"))?;
        db.finish_inference_request(finish)?;
        Ok(())
    }
}
