use crate::{SourceHash, TargetSegment};
use std::error::Error;

pub trait VerifiedRenderer {
    type Error: Error;

    fn source_hash(&self) -> SourceHash;
    fn render_selected(&self, selected: &[TargetSegment]) -> Result<Vec<u8>, Self::Error>;
    fn structural_evidence(&self) -> &'static str;
}
