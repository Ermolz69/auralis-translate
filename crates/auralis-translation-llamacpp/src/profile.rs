use crate::ProfileError;
use auralis_translation::RetryPolicy;
use serde::Deserialize;

const PROFILE_SCHEMA_VERSION: u32 = 1;
const MAX_RESPONSE_BYTES: usize = 4 * 1024 * 1024;
const MAX_TIMEOUT_SECONDS: u64 = 600;
const MAX_TOKENS_PER_LINE: u32 = 4096;
const DEFAULT_TARGET_SEGMENTS: usize = 8;
const MAX_TARGET_SEGMENTS: usize = 64;
const MAX_CONTEXT_SEGMENTS: usize = 8;
const MAX_CONTEXT_BYTES: usize = 64 * 1024;
const MAX_GLOSSARY_BYTES: usize = 32 * 1024;
const MAX_GLOSSARY_ENTRIES: usize = 128;

fn default_target_segments() -> usize {
    DEFAULT_TARGET_SEGMENTS
}

fn default_block_attempts() -> u32 {
    RetryPolicy::default().max_attempts()
}

#[derive(Clone, Debug, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ModelProfile {
    pub schema_version: u32,
    pub model_repo: String,
    pub model_revision: String,
    pub model_file_sha256: String,
    #[serde(default)]
    pub model_file_bytes: Option<u64>,
    pub model_alias: String,
    #[serde(default)]
    pub runtime_build_info: Option<String>,
    #[serde(default)]
    pub min_context_tokens: Option<u32>,
    pub prompt_version: u32,
    #[serde(default)]
    pub prompt_template_sha256: Option<String>,
    #[serde(default = "default_target_segments")]
    pub target_segments_per_block: usize,
    #[serde(default)]
    pub context_before_segments: usize,
    #[serde(default)]
    pub context_after_segments: usize,
    #[serde(default)]
    pub max_context_bytes: usize,
    #[serde(default)]
    pub max_glossary_bytes: usize,
    #[serde(default)]
    pub max_glossary_entries: usize,
    #[serde(default = "default_block_attempts")]
    pub max_block_attempts: u32,
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
        let runtime_fields = [
            self.model_file_bytes.is_some(),
            self.runtime_build_info.is_some(),
            self.min_context_tokens.is_some(),
        ];
        if runtime_fields.iter().any(|present| *present)
            && (!runtime_fields.iter().all(|present| *present)
                || self.model_file_bytes == Some(0)
                || self.runtime_build_info.as_deref().is_none_or(str::is_empty)
                || self.min_context_tokens == Some(0))
        {
            return Err(ProfileError::Invalid(
                "runtime identity fields are incomplete",
            ));
        }
        if !matches!(self.prompt_version, 1..=5) {
            return Err(ProfileError::Invalid("unsupported prompt version"));
        }
        if (self.prompt_version == 5
            && self.prompt_template_sha256.as_deref()
                != Some(crate::contextual_prompt_v5::template_sha256().as_str()))
            || (self.prompt_version != 5 && self.prompt_template_sha256.is_some())
        {
            return Err(ProfileError::Invalid("prompt template identity differs"));
        }
        if !(1..=MAX_TARGET_SEGMENTS).contains(&self.target_segments_per_block)
            || self.context_before_segments > MAX_CONTEXT_SEGMENTS
            || self.context_after_segments > MAX_CONTEXT_SEGMENTS
            || self.max_context_bytes > MAX_CONTEXT_BYTES
            || self.max_glossary_bytes > MAX_GLOSSARY_BYTES
            || self.max_glossary_entries > MAX_GLOSSARY_ENTRIES
            || RetryPolicy::new(self.max_block_attempts).is_none()
        {
            return Err(ProfileError::Invalid("block or context limits are invalid"));
        }
        if (matches!(self.prompt_version, 1 | 4)
            && (self.context_before_segments != 0
                || self.context_after_segments != 0
                || self.max_context_bytes != 0))
            || (self.prompt_version == 2
                && (self.target_segments_per_block != 1
                    || self.context_before_segments + self.context_after_segments == 0
                    || self.max_context_bytes == 0))
            || (matches!(self.prompt_version, 3 | 5) && self.target_segments_per_block != 1)
            || (self.prompt_version == 3
                && self.context_before_segments + self.context_after_segments > 0
                && self.max_context_bytes == 0)
            || (self.prompt_version != 3
                && (self.max_glossary_bytes != 0 || self.max_glossary_entries != 0))
            || (self.prompt_version == 3
                && (self.max_glossary_bytes == 0 || self.max_glossary_entries == 0))
            || (self.prompt_version == 5
                && ((self.context_before_segments + self.context_after_segments > 0
                    && self.max_context_bytes == 0)
                    || self.max_block_attempts != 1))
        {
            return Err(ProfileError::Invalid("prompt and context policy disagree"));
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
