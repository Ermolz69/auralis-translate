use std::fmt;

#[derive(Debug)]
pub enum ProfileError {
    Json(serde_json::Error),
    Invalid(&'static str),
}

impl fmt::Display for ProfileError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Json(error) => error.fmt(f),
            Self::Invalid(reason) => write!(f, "invalid model profile: {reason}"),
        }
    }
}

impl std::error::Error for ProfileError {}
