use super::{ContractError, LanguageCode};

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct LanguagePair {
    source: LanguageCode,
    target: LanguageCode,
}

impl LanguagePair {
    pub fn new(source: LanguageCode, target: LanguageCode) -> Result<Self, ContractError> {
        if !matches!(source, LanguageCode::Chinese | LanguageCode::Japanese)
            || target != LanguageCode::Russian
        {
            return Err(ContractError::UnsupportedLanguagePair);
        }
        Ok(Self { source, target })
    }

    pub fn source(self) -> LanguageCode {
        self.source
    }

    pub fn target(self) -> LanguageCode {
        self.target
    }
}
