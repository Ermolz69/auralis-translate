#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum DiagnosticCode {
    UnchangedSource,
    NoCyrillic,
}

impl DiagnosticCode {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::UnchangedSource => "unchanged_source",
            Self::NoCyrillic => "no_cyrillic",
        }
    }

    pub fn parse(value: &str) -> Option<Self> {
        match value {
            "unchanged_source" => Some(Self::UnchangedSource),
            "no_cyrillic" => Some(Self::NoCyrillic),
            _ => None,
        }
    }
}
