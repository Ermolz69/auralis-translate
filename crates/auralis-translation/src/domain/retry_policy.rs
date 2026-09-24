#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct RetryPolicy {
    max_attempts: u32,
}

impl RetryPolicy {
    pub const MAX_ATTEMPTS: u32 = 3;

    pub fn new(max_attempts: u32) -> Option<Self> {
        (1..=Self::MAX_ATTEMPTS)
            .contains(&max_attempts)
            .then_some(Self { max_attempts })
    }

    pub fn max_attempts(self) -> u32 {
        self.max_attempts
    }
}

impl Default for RetryPolicy {
    fn default() -> Self {
        Self { max_attempts: 1 }
    }
}
