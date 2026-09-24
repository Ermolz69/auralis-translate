use crate::InspectError;
use auralis_translation::ContractError;
use std::fmt;

#[derive(Debug)]
pub enum SrtPlanError {
    Inspect(InspectError),
    Contract(ContractError),
}

impl fmt::Display for SrtPlanError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Inspect(error) => error.fmt(f),
            Self::Contract(error) => error.fmt(f),
        }
    }
}

impl std::error::Error for SrtPlanError {}
