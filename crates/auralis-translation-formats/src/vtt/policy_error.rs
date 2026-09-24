use std::fmt;

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum VttPolicyError {
    ZeroLimit,
    LineLimitExceedsFileLimit,
}

impl fmt::Display for VttPolicyError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::ZeroLimit => write!(f, "WebVTT limits must be positive"),
            Self::LineLimitExceedsFileLimit => write!(f, "WebVTT line limit exceeds file limit"),
        }
    }
}

impl std::error::Error for VttPolicyError {}
