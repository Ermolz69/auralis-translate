#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct SrtBlockPolicy {
    max_target_segments: usize,
}

impl SrtBlockPolicy {
    pub const DEFAULT_TARGET_SEGMENTS: usize = 8;
    pub const MAX_TARGET_SEGMENTS: usize = 64;

    pub fn new(max_target_segments: usize) -> Option<Self> {
        (1..=Self::MAX_TARGET_SEGMENTS)
            .contains(&max_target_segments)
            .then_some(Self {
                max_target_segments,
            })
    }

    pub fn max_target_segments(self) -> usize {
        self.max_target_segments
    }
}

impl Default for SrtBlockPolicy {
    fn default() -> Self {
        Self {
            max_target_segments: Self::DEFAULT_TARGET_SEGMENTS,
        }
    }
}
