use crate::profile::ModelProfile;
use crate::prompt;
use crate::server_report::ServerReport;
use crate::{
    PreparationControl, RequestControlPolicy, decode_chat_response::decode_chat_response,
    local_http::LocalHttp,
};
use auralis_translation::{
    LanguageCode, ProviderError, ProviderResponse, RunControl, RunId, TargetSegment,
    TranslationBatch, TranslationProvider,
};
use reqwest::Url;
use serde_json::json;
use sha2::{Digest, Sha256};
use std::time::Duration;

const CHAT_PATH: &str = "/v1/chat/completions";
const HEALTH_PATH: &str = "/health";
const PROPS_PATH: &str = "/props";
const MODELS_PATH: &str = "/v1/models";
const RESPONSE_SCHEMA_VERSION: u32 = 1;

pub struct LlamaCppProvider {
    http: LocalHttp,
    base: Url,
    endpoint: Url,
    profile: ModelProfile,
}

impl LlamaCppProvider {
    pub fn new(base_url: &str, profile: ModelProfile) -> Result<Self, ProviderError> {
        Self::with_control_policy(base_url, profile, RequestControlPolicy::default())
    }

    pub fn with_control_policy(
        base_url: &str,
        profile: ModelProfile,
        control_policy: RequestControlPolicy,
    ) -> Result<Self, ProviderError> {
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
        let http = LocalHttp::new(
            Duration::from_secs(profile.timeout_seconds),
            profile.max_response_bytes,
            control_policy,
        )?;
        Ok(Self {
            http,
            base,
            endpoint,
            profile,
        })
    }

    pub fn probe_server(&self) -> Result<ServerReport, ProviderError> {
        self.probe_server_with_control(&|| Ok(()))
    }

    pub fn probe_server_with_control(
        &self,
        control: &dyn PreparationControl,
    ) -> Result<ServerReport, ProviderError> {
        control.check()?;
        ServerReport::parse(
            &self.get_bytes(HEALTH_PATH, control)?,
            &self.get_bytes(PROPS_PATH, control)?,
            &self.get_bytes(MODELS_PATH, control)?,
        )
    }

    fn get_bytes(
        &self,
        path: &str,
        control: &dyn PreparationControl,
    ) -> Result<Vec<u8>, ProviderError> {
        let endpoint = self
            .base
            .join(path)
            .map_err(|_| ProviderError("invalid llama.cpp probe endpoint".into()))?;
        self.http
            .request(self.http.client().get(endpoint), Some(control))
    }

    fn translate_line(
        &self,
        prompt_text: String,
        source: &str,
        control: Option<(&dyn RunControl, RunId)>,
    ) -> Result<String, ProviderError> {
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
        let request = self
            .http
            .client()
            .post(self.endpoint.clone())
            .header(
                "x-auralis-source-sha256",
                format!("{:x}", Sha256::digest(source.as_bytes())),
            )
            .json(&request);
        let check = || match control {
            Some((control, run_id)) => match control.pause_requested(run_id) {
                Ok(false) => Ok(()),
                Ok(true) => Err(ProviderError("request paused".into())),
                Err(error) => Err(ProviderError(error.to_string())),
            },
            None => Ok(()),
        };
        let preparation: Option<&dyn PreparationControl> =
            control.map(|_| &check as &dyn PreparationControl);
        decode_chat_response(&self.http.request(request, preparation)?)
    }

    fn translate_controlled(
        &self,
        batch: &TranslationBatch,
        control: Option<(&dyn RunControl, RunId)>,
    ) -> Result<ProviderResponse, ProviderError> {
        if self.profile.prompt_version == 4
            && batch.language_pair().source() != LanguageCode::Chinese
        {
            return Err(ProviderError(
                "Chinese fidelity profile requires Chinese source".into(),
            ));
        }
        if matches!(self.profile.prompt_version, 1 | 4) && !batch.context().is_empty() {
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
                if self.profile.prompt_version == 4 {
                    let prepared = crate::chinese_fidelity_prompt::ChineseFidelityPrompt::prepare(
                        source_line,
                    )?;
                    let candidate =
                        self.translate_line(prepared.text.clone(), source_line, control)?;
                    lines.push(prepared.restore(&candidate)?);
                    continue;
                }
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
                lines.push(self.translate_line(prompt_text, source_line, control)?);
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

impl TranslationProvider for LlamaCppProvider {
    fn translate(&self, batch: &TranslationBatch) -> Result<ProviderResponse, ProviderError> {
        self.translate_controlled(batch, None)
    }

    fn translate_with_control(
        &self,
        batch: &TranslationBatch,
        control: &dyn RunControl,
    ) -> Result<ProviderResponse, ProviderError> {
        self.translate_controlled(batch, Some((control, batch.run_id())))
    }
}
