#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum ModelPreflightOutcome {
    Verified,
    NotRequired,
    Failed,
    Paused,
    Stale,
}

impl ModelPreflightOutcome {
    pub(crate) fn code(self) -> &'static str {
        match self {
            Self::Verified => "verified",
            Self::NotRequired => "not_required",
            Self::Failed => "failed",
            Self::Paused => "paused",
            Self::Stale => "stale",
        }
    }
}
