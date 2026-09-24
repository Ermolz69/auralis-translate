use super::{ContractError, SegmentId};

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SourceSegment {
    id: SegmentId,
    start_ms: u64,
    end_ms: u64,
    lines: Vec<String>,
}

impl SourceSegment {
    pub fn new(
        id: SegmentId,
        start_ms: u64,
        end_ms: u64,
        lines: Vec<String>,
    ) -> Result<Self, ContractError> {
        if start_ms >= end_ms {
            return Err(ContractError::InvalidTiming);
        }
        if lines.is_empty() || lines.iter().any(|line| !valid_line(line)) {
            return Err(ContractError::InvalidText);
        }
        Ok(Self {
            id,
            start_ms,
            end_ms,
            lines,
        })
    }

    pub fn id(&self) -> SegmentId {
        self.id
    }

    pub fn start_ms(&self) -> u64 {
        self.start_ms
    }

    pub fn end_ms(&self) -> u64 {
        self.end_ms
    }

    pub fn lines(&self) -> &[String] {
        &self.lines
    }
}

pub(crate) fn valid_line(text: &str) -> bool {
    !text.is_empty() && !text.chars().any(char::is_control)
}
