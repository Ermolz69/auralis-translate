#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum NameStatus {
    Candidate,
    NeedsReview,
    Approved,
}

impl NameStatus {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Candidate => "candidate",
            Self::NeedsReview => "needs_review",
            Self::Approved => "approved",
        }
    }
}
