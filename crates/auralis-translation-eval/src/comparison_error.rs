use thiserror::Error;

use crate::verify::VerifyError;
use auralis_translation::{ContractError, TranslateBatchError};

#[derive(Debug, Error)]
pub enum ComparisonError {
    #[error(transparent)]
    Corpus(#[from] VerifyError),
    #[error("I/O error: {0}")]
    Io(#[from] std::io::Error),
    #[error("invalid comparison request: {0}")]
    InvalidInput(String),
    #[error(transparent)]
    Contract(#[from] ContractError),
    #[error(transparent)]
    Translation(#[from] TranslateBatchError),
}
