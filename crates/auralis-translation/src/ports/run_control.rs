use crate::RunId;
use std::error::Error;

pub trait RunControl {
    fn pause_requested(&self, run_id: RunId) -> Result<bool, Box<dyn Error>>;
}
