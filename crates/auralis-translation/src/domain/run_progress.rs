use super::RunId;

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct RunProgress {
    pub run_id: RunId,
    pub committed_blocks: usize,
    pub total_blocks: usize,
}
