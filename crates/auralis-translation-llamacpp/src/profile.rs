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
const MAX_APPROVED_TERMS_BYTES: usize = 32 * 1024;
const MAX_APPROVED_TERMS_ENTRIES: usize = 128;
const MAX_TOKEN_SAFETY_MARGIN: u32 = 512;

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
    pub strict_source_identifiers: bool,
    #[serde(default)]
    pub source_prefix_repair: bool,
    #[serde(default)]
    pub source_prefix_repair_v2: bool,
    #[serde(default)]
    pub strict_source_times: bool,
    #[serde(default)]
    pub prompt_template_sha256: Option<String>,
    #[serde(default)]
    pub name_registry_policy_sha256: Option<String>,
    #[serde(default)]
    pub max_name_proposals_entries: usize,
    #[serde(default)]
    pub max_name_proposals_bytes: usize,
    #[serde(default = "default_target_segments")]
    pub target_segments_per_block: usize,
    #[serde(default)]
    pub context_before_segments: usize,
    #[serde(default)]
    pub context_after_segments: usize,
    #[serde(default)]
    pub max_context_bytes: usize,
    #[serde(default)]
    pub token_safety_margin_tokens: Option<u32>,
    #[serde(default)]
    pub max_glossary_bytes: usize,
    #[serde(default)]
    pub max_glossary_entries: usize,
    #[serde(default)]
    pub max_approved_terms_bytes: usize,
    #[serde(default)]
    pub max_approved_terms_entries: usize,
    #[serde(default = "default_block_attempts")]
    pub max_block_attempts: u32,
    #[serde(default)]
    pub retry_json_tail_once: bool,
    #[serde(default)]
    pub retry_length_json_tail_once: bool,
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
        if !matches!(self.prompt_version, 1..=8) {
            return Err(ProfileError::Invalid("unsupported prompt version"));
        }
        if self.strict_source_identifiers
            && (self.prompt_version != 6 || self.model_file_bytes.is_none())
        {
            return Err(ProfileError::Invalid(
                "strict source identifiers require a checked v6 profile",
            ));
        }
        if self.source_prefix_repair
            && (self.prompt_version != 6
                || !self.strict_source_identifiers
                || self.model_file_bytes.is_none())
        {
            return Err(ProfileError::Invalid(
                "source prefix repair requires a checked strict v6 profile",
            ));
        }
        if self.source_prefix_repair_v2
            && (self.source_prefix_repair
                || self.prompt_version != 6
                || !self.strict_source_identifiers
                || self.model_file_bytes.is_none())
        {
            return Err(ProfileError::Invalid(
                "source prefix repair v2 requires an exclusive checked strict v6 profile",
            ));
        }
        if self.strict_source_times && !self.source_prefix_repair_v2 {
            return Err(ProfileError::Invalid(
                "strict source times require checked source prefix repair v2",
            ));
        }
        if self.retry_json_tail_once
            && (self.prompt_version != 6
                || self.model_file_bytes.is_none()
                || self.max_block_attempts != 2)
        {
            return Err(ProfileError::Invalid(
                "JSON-tail retry requires a checked v6 profile with two attempts",
            ));
        }
        if self.retry_length_json_tail_once && !self.retry_json_tail_once {
            return Err(ProfileError::Invalid(
                "length-limited JSON-tail retry requires the checked v6 tail-retry policy",
            ));
        }
        let expected_template = match self.prompt_version {
            5 => Some(crate::contextual_prompt_v5::template_sha256()),
            6 => Some(crate::target_schema_v6::template_sha256()),
            7 => Some(crate::contextual_prompt_v7::template_sha256()),
            8 => Some(crate::contextual_prompt_v8::template_sha256()),
            _ => None,
        };
        if self.prompt_template_sha256.as_deref() != expected_template.as_deref() {
            return Err(ProfileError::Invalid("prompt template identity differs"));
        }
        if let Some(hash) = &self.name_registry_policy_sha256 {
            if hash != &crate::name_registry_policy_sha256()
                || self.prompt_version != 8
                || self.model_file_bytes.is_none()
                || !(1..=MAX_APPROVED_TERMS_ENTRIES).contains(&self.max_name_proposals_entries)
                || !(1..=MAX_APPROVED_TERMS_BYTES).contains(&self.max_name_proposals_bytes)
            {
                return Err(ProfileError::Invalid(
                    "name registry policy or limits differ",
                ));
            }
        } else if self.max_name_proposals_entries != 0 || self.max_name_proposals_bytes != 0 {
            return Err(ProfileError::Invalid(
                "name proposal limits require a pinned policy",
            ));
        }
        if !(1..=MAX_TARGET_SEGMENTS).contains(&self.target_segments_per_block)
            || self.context_before_segments > MAX_CONTEXT_SEGMENTS
            || self.context_after_segments > MAX_CONTEXT_SEGMENTS
            || self.max_context_bytes > MAX_CONTEXT_BYTES
            || self.max_glossary_bytes > MAX_GLOSSARY_BYTES
            || self.max_glossary_entries > MAX_GLOSSARY_ENTRIES
            || self.max_approved_terms_bytes > MAX_APPROVED_TERMS_BYTES
            || self.max_approved_terms_entries > MAX_APPROVED_TERMS_ENTRIES
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
            || (matches!(self.prompt_version, 3 | 5 | 6) && self.target_segments_per_block != 1)
            || (matches!(self.prompt_version, 7 | 8)
                && (self.target_segments_per_block > 8
                    || self.model_file_bytes.is_none()
                    || self.min_context_tokens.is_none()
                    || self.token_safety_margin_tokens.is_none()
                    || self.max_block_attempts != 1))
            || (self.prompt_version == 3
                && self.context_before_segments + self.context_after_segments > 0
                && self.max_context_bytes == 0)
            || (self.prompt_version != 3
                && (self.max_glossary_bytes != 0 || self.max_glossary_entries != 0))
            || (self.prompt_version == 3
                && (self.max_glossary_bytes == 0 || self.max_glossary_entries == 0))
            || (!matches!(self.prompt_version, 5..=8)
                && (self.max_approved_terms_bytes != 0 || self.max_approved_terms_entries != 0))
            || (self.max_approved_terms_bytes == 0) != (self.max_approved_terms_entries == 0)
            || (matches!(self.prompt_version, 5..=8)
                && self.max_approved_terms_bytes > 0
                && (self.token_safety_margin_tokens.is_none() || self.min_context_tokens.is_none()))
            || (matches!(self.prompt_version, 5..=8)
                && ((self.context_before_segments + self.context_after_segments > 0
                    && (self.max_context_bytes == 0
                        || self.token_safety_margin_tokens.is_none()
                        || self.min_context_tokens.is_none()))
                    || (self.max_block_attempts != 1 && !self.retry_json_tail_once)))
            || self.token_safety_margin_tokens.is_some_and(|margin| {
                !matches!(self.prompt_version, 5..=8)
                    || !(1..=MAX_TOKEN_SAFETY_MARGIN).contains(&margin)
                    || self.min_context_tokens.is_none_or(|context| {
                        context <= self.max_tokens_per_line.saturating_add(margin)
                    })
            })
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
