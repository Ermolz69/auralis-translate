use std::fmt;

#[derive(Debug)]
pub enum ProviderError {
    Permanent(String),
    Transient(String),
    Storage(String),
    NameProposalReviewRequired(String),
}

impl ProviderError {
    pub fn is_retryable(&self) -> bool {
        matches!(self, Self::Transient(_))
    }
}

impl fmt::Display for ProviderError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Permanent(message)
            | Self::Transient(message)
            | Self::Storage(message)
            | Self::NameProposalReviewRequired(message) => message.fmt(f),
        }
    }
}

impl std::error::Error for ProviderError {}
