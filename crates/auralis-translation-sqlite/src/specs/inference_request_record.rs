use crate::AttemptId;
use auralis_translation::{InferenceRequestFinish, InferenceRequestStart};

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct InferenceRequestRecord {
    pub sequence: i64,
    pub attempt_id: AttemptId,
    pub start: InferenceRequestStart,
    pub finish: Option<InferenceRequestFinish>,
}
