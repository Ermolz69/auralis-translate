use std::fmt;

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum SrtPolicyError {
    ZeroLimit,
    LineLimitExceedsFileLimit,
}

impl fmt::Display for SrtPolicyError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "invalid SRT parse policy: {self:?}")
    }
}

impl std::error::Error for SrtPolicyError {}
