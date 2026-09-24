use crate::{BlockCheckpoint, RunId};
use std::error::Error;

pub trait CheckpointStore {
    type Error: Error;

    fn load(&self, run_id: RunId) -> Result<Vec<BlockCheckpoint>, Self::Error>;
    fn commit(&mut self, checkpoint: &BlockCheckpoint) -> Result<(), Self::Error>;
}
