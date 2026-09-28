use super::{InferenceRequestId, RunId, SegmentId, SourceHash};

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct InferenceRequestStart {
    pub request_id: InferenceRequestId,
    pub run_id: RunId,
    pub batch_fingerprint: SourceHash,
    pub segment_id: SegmentId,
    pub line_index: u32,
    pub rendered_request: Vec<u8>,
}

impl InferenceRequestStart {
    pub fn request_sha256(&self) -> SourceHash {
        SourceHash::digest(&self.rendered_request)
    }
}
