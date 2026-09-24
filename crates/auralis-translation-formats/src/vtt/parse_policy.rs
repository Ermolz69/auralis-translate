use super::VttPolicyError;

const DEFAULT_MAX_BYTES: usize = 16 * 1024 * 1024;
const DEFAULT_MAX_CUES: u32 = 100_000;
const DEFAULT_MAX_LINE_BYTES: usize = 16 * 1024;

#[derive(Clone, Copy, Debug)]
pub struct VttParsePolicy {
    max_bytes: usize,
    max_cues: u32,
    max_line_bytes: usize,
}

impl VttParsePolicy {
    pub fn new(
        max_bytes: usize,
        max_cues: u32,
        max_line_bytes: usize,
    ) -> Result<Self, VttPolicyError> {
        if max_bytes == 0 || max_cues == 0 || max_line_bytes == 0 {
            return Err(VttPolicyError::ZeroLimit);
        }
        if max_line_bytes > max_bytes {
            return Err(VttPolicyError::LineLimitExceedsFileLimit);
        }
        Ok(Self {
            max_bytes,
            max_cues,
            max_line_bytes,
        })
    }

    pub fn max_bytes(self) -> usize {
        self.max_bytes
    }
    pub fn max_cues(self) -> u32 {
        self.max_cues
    }
    pub fn max_line_bytes(self) -> usize {
        self.max_line_bytes
    }
}

impl Default for VttParsePolicy {
    fn default() -> Self {
        Self {
            max_bytes: DEFAULT_MAX_BYTES,
            max_cues: DEFAULT_MAX_CUES,
            max_line_bytes: DEFAULT_MAX_LINE_BYTES,
        }
    }
}
