#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum DiagnosticCode {
    UnchangedSource,
    NoCyrillic,
    GlossaryTermMissing,
    IdentifierMismatch,
    TimeMismatch,
}

impl DiagnosticCode {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::UnchangedSource => "unchanged_source",
            Self::NoCyrillic => "no_cyrillic",
            Self::GlossaryTermMissing => "glossary_term_missing",
            Self::IdentifierMismatch => "identifier_mismatch",
            Self::TimeMismatch => "time_mismatch",
        }
    }

    pub fn parse(value: &str) -> Option<Self> {
        match value {
            "unchanged_source" => Some(Self::UnchangedSource),
            "no_cyrillic" => Some(Self::NoCyrillic),
            "glossary_term_missing" => Some(Self::GlossaryTermMissing),
            "identifier_mismatch" => Some(Self::IdentifierMismatch),
            "time_mismatch" => Some(Self::TimeMismatch),
            _ => None,
        }
    }
}
