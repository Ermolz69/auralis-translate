use super::{NameOccurrence, NameProposal, NameStatus};
use std::num::NonZeroU32;

#[derive(Clone, Copy, Debug, Eq, Hash, Ord, PartialEq, PartialOrd)]
pub struct NameEntityId(NonZeroU32);

impl NameEntityId {
    pub fn new(value: u32) -> Option<Self> {
        NonZeroU32::new(value).map(Self)
    }
    pub fn get(self) -> u32 {
        self.0.get()
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct NameEntity {
    pub id: NameEntityId,
    pub chinese: String,
    pub possible_aliases: Vec<String>,
    pub occurrences: Vec<NameOccurrence>,
    pub proposal: Option<NameProposal>,
    pub status: NameStatus,
    pub revision: NonZeroU32,
}
