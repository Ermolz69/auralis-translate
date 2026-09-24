#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct BlockPolicy {
    max_target_segments: usize,
    context_before_segments: usize,
    context_after_segments: usize,
}

impl BlockPolicy {
    pub const DEFAULT_TARGET_SEGMENTS: usize = 8;
    pub const MAX_TARGET_SEGMENTS: usize = 64;
    pub const MAX_CONTEXT_SEGMENTS: usize = 8;

    pub fn new(max_target_segments: usize) -> Option<Self> {
        Self::with_context(max_target_segments, 0, 0)
    }

    pub fn with_context(
        max_target_segments: usize,
        context_before_segments: usize,
        context_after_segments: usize,
    ) -> Option<Self> {
        ((1..=Self::MAX_TARGET_SEGMENTS).contains(&max_target_segments)
            && context_before_segments <= Self::MAX_CONTEXT_SEGMENTS
            && context_after_segments <= Self::MAX_CONTEXT_SEGMENTS)
            .then_some(Self {
                max_target_segments,
                context_before_segments,
                context_after_segments,
            })
    }

    pub fn max_target_segments(self) -> usize {
        self.max_target_segments
    }
    pub fn context_before_segments(self) -> usize {
        self.context_before_segments
    }
    pub fn context_after_segments(self) -> usize {
        self.context_after_segments
    }
}

impl Default for BlockPolicy {
    fn default() -> Self {
        Self {
            max_target_segments: Self::DEFAULT_TARGET_SEGMENTS,
            context_before_segments: 0,
            context_after_segments: 0,
        }
    }
}
