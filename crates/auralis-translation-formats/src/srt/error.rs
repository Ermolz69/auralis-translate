use super::SrtErrorCode;
use std::fmt;

#[derive(Debug)]
pub struct SrtError {
    pub code: SrtErrorCode,
    pub line: Option<usize>,
}

impl SrtError {
    pub(crate) fn at(code: SrtErrorCode, line: usize) -> Self {
        Self {
            code,
            line: Some(line),
        }
    }

    pub(crate) fn document(code: SrtErrorCode) -> Self {
        Self { code, line: None }
    }
}

impl fmt::Display for SrtError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self.line {
            Some(line) => write!(f, "SRT error {:?} at line {line}", self.code),
            None => write!(f, "SRT error {:?}", self.code),
        }
    }
}

impl std::error::Error for SrtError {}
