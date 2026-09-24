use std::fmt;

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum ContractError {
    UnsupportedLanguagePair,
    InvalidTiming,
    InvalidText,
    EmptyTargets,
    DuplicateSegmentId,
    UnsupportedSchemaVersion,
    ResponseIds,
    ResponseLines,
    InvalidGlossary,
    GlossaryConflict,
}

impl fmt::Display for ContractError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "translation contract error: {self:?}")
    }
}

impl std::error::Error for ContractError {}
