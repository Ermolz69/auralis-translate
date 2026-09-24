use crate::ProfileError;
use serde::Deserialize;

const PROFILE_SCHEMA_VERSION: u32 = 1;
const MAX_RESPONSE_BYTES: usize = 4 * 1024 * 1024;
const MAX_TIMEOUT_SECONDS: u64 = 600;
const MAX_TOKENS_PER_LINE: u32 = 4096;

#[derive(Clone, Debug, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ModelProfile {
    pub schema_version: u32,
    pub model_repo: String,
    pub model_revision: String,
    pub model_file_sha256: String,
    pub model_alias: String,
    pub prompt_version: u32,
    pub temperature: f64,
    pub top_p: f64,
    pub top_k: i32,
    pub repeat_penalty: f64,
    pub max_tokens_per_line: u32,
    pub max_response_bytes: usize,
    pub timeout_seconds: u64,
}

impl ModelProfile {
    pub fn from_json(bytes: &[u8]) -> Result<Self, ProfileError> {
        let profile: Self = serde_json::from_slice(bytes).map_err(ProfileError::Json)?;
        profile.validate()?;
        Ok(profile)
    }

    fn validate(&self) -> Result<(), ProfileError> {
        if self.schema_version != PROFILE_SCHEMA_VERSION {
            return Err(ProfileError::Invalid("unsupported schema version"));
        }
        if self.model_repo.trim().is_empty()
            || self.model_revision.trim().is_empty()
            || self.model_alias.trim().is_empty()
        {
            return Err(ProfileError::Invalid("model identity is incomplete"));
        }
        if self.model_file_sha256.len() != 64
            || !self
                .model_file_sha256
                .bytes()
                .all(|byte| byte.is_ascii_hexdigit())
        {
            return Err(ProfileError::Invalid("model SHA-256 must be hexadecimal"));
        }
        if self.prompt_version != 1 {
            return Err(ProfileError::Invalid("unsupported prompt version"));
        }
        if !self.temperature.is_finite()
            || !(0.0..=2.0).contains(&self.temperature)
            || !self.top_p.is_finite()
            || !(0.0..=1.0).contains(&self.top_p)
            || self.top_k < 1
            || !self.repeat_penalty.is_finite()
            || self.repeat_penalty <= 0.0
            || !(1..=MAX_TOKENS_PER_LINE).contains(&self.max_tokens_per_line)
            || !(1..=MAX_RESPONSE_BYTES).contains(&self.max_response_bytes)
            || !(1..=MAX_TIMEOUT_SECONDS).contains(&self.timeout_seconds)
        {
            return Err(ProfileError::Invalid("generation limits are invalid"));
        }
        Ok(())
    }
}
