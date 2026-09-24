use crate::profile::ModelProfile;
use crate::prompt;
use crate::response::ChatResponse;
use crate::server_report::ServerReport;
use auralis_translation::{
    ProviderError, ProviderResponse, TargetSegment, TranslationBatch, TranslationProvider,
};
use reqwest::Url;
use reqwest::blocking::Client;
use serde_json::json;
use std::io::Read;
use std::time::Duration;

const CHAT_PATH: &str = "/v1/chat/completions";
const HEALTH_PATH: &str = "/health";
const PROPS_PATH: &str = "/props";
const MODELS_PATH: &str = "/v1/models";
const RESPONSE_SCHEMA_VERSION: u32 = 1;

pub struct LlamaCppProvider {
    client: Client,
    base: Url,
    endpoint: Url,
    profile: ModelProfile,
}

impl LlamaCppProvider {
    pub fn new(base_url: &str, profile: ModelProfile) -> Result<Self, ProviderError> {
        let base =
            Url::parse(base_url).map_err(|_| ProviderError("invalid llama.cpp URL".into()))?;
        if base.scheme() != "http"
            || !matches!(base.host_str(), Some("127.0.0.1" | "::1" | "localhost"))
            || base.path() != "/"
            || base.query().is_some()
            || base.fragment().is_some()
        {
            return Err(ProviderError(
                "llama.cpp URL must be a local HTTP root".into(),
            ));
        }
        let endpoint = base
            .join(CHAT_PATH)
            .map_err(|_| ProviderError("invalid llama.cpp endpoint".into()))?;
        let client = Client::builder()
            .no_proxy()
            .timeout(Duration::from_secs(profile.timeout_seconds))
            .build()
            .map_err(|error| ProviderError(error.to_string()))?;
        Ok(Self {
            client,
            base,
            endpoint,
            profile,
        })
    }

    pub fn probe_server(&self) -> Result<ServerReport, ProviderError> {
        ServerReport::parse(
            &self.get_bytes(HEALTH_PATH)?,
            &self.get_bytes(PROPS_PATH)?,
            &self.get_bytes(MODELS_PATH)?,
        )
    }

    fn get_bytes(&self, path: &str) -> Result<Vec<u8>, ProviderError> {
        let endpoint = self
            .base
            .join(path)
            .map_err(|_| ProviderError("invalid llama.cpp probe endpoint".into()))?;
        let response = self
            .client
            .get(endpoint)
            .send()
            .map_err(|error| ProviderError(error.to_string()))?;
        if !response.status().is_success() {
            return Err(ProviderError(format!(
                "llama.cpp probe returned HTTP {}",
                response.status()
            )));
        }
        let mut reader = response.take(self.profile.max_response_bytes as u64 + 1);
        let mut bytes = Vec::new();
        reader
            .read_to_end(&mut bytes)
            .map_err(|error| ProviderError(error.to_string()))?;
        if bytes.len() > self.profile.max_response_bytes {
            return Err(ProviderError(
                "llama.cpp probe response is too large".into(),
            ));
        }
        Ok(bytes)
    }

    fn translate_line(&self, prompt_text: String) -> Result<String, ProviderError> {
        let request = json!({
            "model": self.profile.model_alias,
            "messages": [{"role": "user", "content": prompt_text}],
            "temperature": self.profile.temperature,
            "top_p": self.profile.top_p,
            "top_k": self.profile.top_k,
            "repeat_penalty": self.profile.repeat_penalty,
            "max_tokens": self.profile.max_tokens_per_line,
            "stream": false
        });
        let response = self
            .client
            .post(self.endpoint.clone())
            .json(&request)
            .send()
            .map_err(|error| ProviderError(error.to_string()))?;
        if !response.status().is_success() {
            return Err(ProviderError(format!(
                "llama.cpp returned HTTP {}",
                response.status()
            )));
        }
        let mut reader = response.take(self.profile.max_response_bytes as u64 + 1);
        let mut body = Vec::new();
        reader
            .read_to_end(&mut body)
            .map_err(|error| ProviderError(error.to_string()))?;
        if body.len() > self.profile.max_response_bytes {
            return Err(ProviderError(
                "llama.cpp response exceeds profile limit".into(),
            ));
        }
        let parsed: ChatResponse = serde_json::from_slice(&body)
            .map_err(|_| ProviderError("invalid llama.cpp response JSON".into()))?;
        if parsed.choices.len() != 1 {
            return Err(ProviderError(
                "llama.cpp response must have one choice".into(),
            ));
        }
        let choice = parsed
            .choices
            .into_iter()
            .next()
            .ok_or_else(|| ProviderError("llama.cpp response has no choice".into()))?;
        if choice.finish_reason.as_deref() != Some("stop") {
            return Err(ProviderError(
                "llama.cpp did not finish the response".into(),
            ));
        }
        let content = choice
            .message
            .content
            .ok_or_else(|| ProviderError("llama.cpp response has no text".into()))?;
        if content.trim().is_empty() {
            return Err(ProviderError("llama.cpp response is empty".into()));
        }
        Ok(content)
    }
}

impl TranslationProvider for LlamaCppProvider {
    fn translate(&self, batch: &TranslationBatch) -> Result<ProviderResponse, ProviderError> {
        if self.profile.prompt_version == 1 && !batch.context().is_empty() {
            return Err(ProviderError(
                "experimental profile has no context support".into(),
            ));
        }
        if self.profile.prompt_version != 3 && !batch.glossary().is_empty() {
            return Err(ProviderError(
                "profile does not support glossary entries".into(),
            ));
        }
        if batch.glossary().len() > self.profile.max_glossary_entries {
            return Err(ProviderError("glossary exceeds profile entry limit".into()));
        }
        let glossary_bytes = prompt::glossary_payload_bytes(batch.glossary())
            .map_err(|error| ProviderError(error.to_string()))?;
        if glossary_bytes > self.profile.max_glossary_bytes {
            return Err(ProviderError("glossary exceeds profile byte limit".into()));
        }
        let context_bytes: usize = batch
            .context()
            .iter()
            .flat_map(|segment| segment.lines())
            .map(String::len)
            .sum();
        if context_bytes > self.profile.max_context_bytes {
            return Err(ProviderError("context exceeds profile byte limit".into()));
        }
        let mut translations = Vec::with_capacity(batch.targets().len());
        for segment in batch.targets() {
            let segment_glossary = batch
                .glossary()
                .iter()
                .filter(|entry| {
                    entry
                        .segment_ids()
                        .is_none_or(|scope| scope.contains(&segment.id()))
                })
                .cloned()
                .collect::<Vec<_>>();
            let mut lines = Vec::with_capacity(segment.lines().len());
            for (line_index, source_line) in segment.lines().iter().enumerate() {
                let prompt_text = match self.profile.prompt_version {
                    1 => prompt::translate_line(source_line),
                    2 => prompt::translate_line_with_context(segment, line_index, batch.context()),
                    3 => prompt::translate_line_with_glossary(
                        segment,
                        line_index,
                        batch.context(),
                        &segment_glossary,
                    ),
                    _ => return Err(ProviderError("unsupported prompt version".into())),
                };
                lines.push(self.translate_line(prompt_text)?);
            }
            translations.push(TargetSegment {
                id: segment.id(),
                lines,
            });
        }
        Ok(ProviderResponse {
            schema_version: RESPONSE_SCHEMA_VERSION,
            translations,
        })
    }
}
