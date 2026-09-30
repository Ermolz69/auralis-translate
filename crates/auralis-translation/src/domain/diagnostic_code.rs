#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum DiagnosticCode {
    UnchangedSource,
    NoCyrillic,
    GlossaryTermMissing,
    IdentifierMismatch,
    SourcePrefixInserted,
    TimeMismatch,
    MeasurementMismatch,
    CapacityMismatch,
}

impl DiagnosticCode {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::UnchangedSource => "unchanged_source",
            Self::NoCyrillic => "no_cyrillic",
            Self::GlossaryTermMissing => "glossary_term_missing",
            Self::IdentifierMismatch => "identifier_mismatch",
            Self::SourcePrefixInserted => "source_prefix_inserted",
            Self::TimeMismatch => "time_mismatch",
            Self::MeasurementMismatch => "measurement_mismatch",
            Self::CapacityMismatch => "capacity_mismatch",
        }
    }

    pub fn parse(value: &str) -> Option<Self> {
        match value {
            "unchanged_source" => Some(Self::UnchangedSource),
            "no_cyrillic" => Some(Self::NoCyrillic),
            "glossary_term_missing" => Some(Self::GlossaryTermMissing),
            "identifier_mismatch" => Some(Self::IdentifierMismatch),
            "source_prefix_inserted" => Some(Self::SourcePrefixInserted),
            "time_mismatch" => Some(Self::TimeMismatch),
            "measurement_mismatch" => Some(Self::MeasurementMismatch),
            "capacity_mismatch" => Some(Self::CapacityMismatch),
            _ => None,
        }
    }
}
