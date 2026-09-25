use std::error::Error;
use std::fmt::{Display, Formatter};

#[derive(Debug)]
pub enum ReleaseManifestError {
    Json(serde_json::Error),
    Invalid(&'static str),
}

impl Display for ReleaseManifestError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Json(error) => write!(formatter, "invalid release manifest JSON: {error}"),
            Self::Invalid(message) => write!(formatter, "invalid release manifest: {message}"),
        }
    }
}

impl Error for ReleaseManifestError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::Json(error) => Some(error),
            Self::Invalid(_) => None,
        }
    }
}
