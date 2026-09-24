use std::fmt;

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum IdError {
    InvalidUuid,
    NilUuid,
}

impl fmt::Display for IdError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "invalid translation identity: {self:?}")
    }
}

impl std::error::Error for IdError {}
