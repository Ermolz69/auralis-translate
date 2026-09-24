#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum SrtErrorCode {
    InvalidUtf8,
    InvalidLineEnding,
    InvalidCueLabel,
    InvalidTiming,
    MissingText,
    MissingSeparator,
    UnsupportedMarkup,
    UnsupportedControl,
    TooManyCues,
    TranslationIds,
    TranslationLines,
    StructuralMismatch,
}
