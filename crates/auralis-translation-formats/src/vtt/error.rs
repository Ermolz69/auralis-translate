use super::VttErrorCode;
use std::fmt;

#[derive(Debug)]
pub struct VttError {
    pub code: VttErrorCode,
    pub line: Option<usize>,
}

impl VttError {
    pub(crate) fn at(code: VttErrorCode, line: usize) -> Self {
        Self {
            code,
            line: Some(line),
        }
    }

    pub(crate) fn document(code: VttErrorCode) -> Self {
        Self { code, line: None }
    }
}

impl fmt::Display for VttError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self.line {
            Some(line) => write!(f, "WebVTT error {:?} at line {line}", self.code),
            None => write!(f, "WebVTT error {:?}", self.code),
        }
    }
}

impl std::error::Error for VttError {}
