use crate::{InferenceRequestFinish, InferenceRequestStart};
use std::error::Error;

pub trait InferenceRequestJournal: Send + Sync {
    fn begin(&self, start: &InferenceRequestStart) -> Result<(), Box<dyn Error + Send + Sync>>;
    fn finish(&self, finish: &InferenceRequestFinish) -> Result<(), Box<dyn Error + Send + Sync>>;
}
