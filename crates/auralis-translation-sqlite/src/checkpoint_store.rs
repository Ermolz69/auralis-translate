use crate::{CheckpointSpec, DbError, TranslateDb, diagnostic_codec};
use auralis_translation::{BlockCheckpoint, CheckpointStore, RunId};

impl CheckpointStore for TranslateDb {
    type Error = DbError;

    fn load(&self, run_id: RunId) -> Result<Vec<BlockCheckpoint>, Self::Error> {
        self.checkpoints(run_id)?
            .into_iter()
            .map(|record| {
                Ok(BlockCheckpoint {
                    run_id: record.run_id,
                    block_index: record.block_index,
                    input_fingerprint: record.input_fingerprint,
                    accepted: record.accepted,
                    diagnostics: diagnostic_codec::decode(&record.diagnostics_json)?,
                    attempt_count: record.attempt_count,
                })
            })
            .collect()
    }

    fn commit(&mut self, checkpoint: &BlockCheckpoint) -> Result<(), Self::Error> {
        self.commit_checkpoint(&CheckpointSpec {
            run_id: checkpoint.run_id,
            block_index: checkpoint.block_index,
            input_fingerprint: checkpoint.input_fingerprint,
            accepted: checkpoint.accepted.clone(),
            diagnostics_json: diagnostic_codec::encode(&checkpoint.diagnostics)?,
            attempt_count: checkpoint.attempt_count,
        })
    }
}
