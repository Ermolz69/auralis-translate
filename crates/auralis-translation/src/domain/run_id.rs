use super::IdError;
use std::fmt;
use uuid::Uuid;

#[derive(Clone, Copy, Debug, Eq, Hash, PartialEq)]
pub struct RunId(Uuid);

impl RunId {
    pub fn new(value: Uuid) -> Option<Self> {
        (!value.is_nil()).then_some(Self(value))
    }

    pub fn parse(value: &str) -> Result<Self, IdError> {
        let id = Uuid::parse_str(value).map_err(|_| IdError::InvalidUuid)?;
        Self::new(id).ok_or(IdError::NilUuid)
    }

    pub fn get(self) -> Uuid {
        self.0
    }
}

impl fmt::Display for RunId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        self.0.fmt(f)
    }
}
