use crate::{ContractError, ProviderError};
use std::fmt;

#[derive(Debug)]
pub enum TranslateBatchError {
    Provider(ProviderError),
    Contract(ContractError),
}

impl fmt::Display for TranslateBatchError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Provider(error) => error.fmt(f),
            Self::Contract(error) => error.fmt(f),
        }
    }
}

impl std::error::Error for TranslateBatchError {}
