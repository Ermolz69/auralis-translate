use super::{InferenceRequestId, InferenceRequestOutcome};

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct InferenceRequestFinish {
    pub request_id: InferenceRequestId,
    pub outcome: InferenceRequestOutcome,
    pub raw_response: Option<Vec<u8>>,
    pub restored_candidate: Option<String>,
    pub prompt_tokens: Option<u32>,
    pub completion_tokens: Option<u32>,
    pub elapsed_ms: u64,
    pub error_detail: Option<String>,
}
