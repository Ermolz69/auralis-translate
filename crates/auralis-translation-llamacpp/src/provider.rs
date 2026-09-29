use crate::profile::ModelProfile;
use crate::prompt;
use crate::server_report::ServerReport;
use crate::{
    PreparationControl, RequestControlPolicy, decode_chat_response::decode_chat_response,
    local_http::LocalHttp,
};
use auralis_translation::{
    InferenceRequestFinish, InferenceRequestId, InferenceRequestJournal, InferenceRequestKind,
    InferenceRequestOutcome, InferenceRequestStart, LanguageCode, ProviderError, ProviderResponse,
    RunControl, RunId, SegmentId, SourceHash, TargetSegment, TranslationBatch, TranslationProvider,
};
use reqwest::Url;
use reqwest::header::CONTENT_TYPE;
use serde_json::json;
use sha2::{Digest, Sha256};
use std::sync::Arc;
use std::time::{Duration, Instant};
use uuid::Uuid;

const CHAT_PATH: &str = "/v1/chat/completions";
const HEALTH_PATH: &str = "/health";
const PROPS_PATH: &str = "/props";
const MODELS_PATH: &str = "/v1/models";
const APPLY_TEMPLATE_PATH: &str = "/apply-template";
const TOKENIZE_PATH: &str = "/tokenize";
const RESPONSE_SCHEMA_VERSION: u32 = 1;

#[derive(Clone, Copy)]
struct PreflightTarget {
    run_id: RunId,
    batch_fingerprint: SourceHash,
    segment_id: SegmentId,
    line_index: u32,
}

pub struct LlamaCppProvider {
    http: LocalHttp,
    base: Url,
    endpoint: Url,
    profile: ModelProfile,
    inference_journal: Option<Arc<dyn InferenceRequestJournal>>,
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
        let base = Url::parse(base_url)
            .map_err(|_| ProviderError::Permanent("invalid llama.cpp URL".into()))?;
        if base.scheme() != "http"
            || !matches!(base.host_str(), Some("127.0.0.1" | "::1" | "localhost"))
            || base.path() != "/"
            || base.query().is_some()
            || base.fragment().is_some()
        {
            return Err(ProviderError::Permanent(
                "llama.cpp URL must be a local HTTP root".into(),
            ));
        }
        let endpoint = base
            .join(CHAT_PATH)
            .map_err(|_| ProviderError::Permanent("invalid llama.cpp endpoint".into()))?;
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
            inference_journal: None,
        })
    }

    pub fn with_inference_journal(mut self, journal: Arc<dyn InferenceRequestJournal>) -> Self {
        self.inference_journal = Some(journal);
        self
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
            .map_err(|_| ProviderError::Permanent("invalid llama.cpp probe endpoint".into()))?;
        self.http
            .request(self.http.client().get(endpoint), Some(control))
    }

    fn translate_line(
        &self,
        prompt_text: String,
        source: &str,
        control: Option<(&dyn RunControl, RunId)>,
        response_format: Option<serde_json::Value>,
    ) -> Result<String, ProviderError> {
        let mut request = json!({
            "model": self.profile.model_alias,
            "messages": [{"role": "user", "content": prompt_text}],
            "temperature": self.profile.temperature,
            "top_p": self.profile.top_p,
            "top_k": self.profile.top_k,
            "repeat_penalty": self.profile.repeat_penalty,
            "max_tokens": self.profile.max_tokens_per_line,
            "stream": false
        });
        if let Some(format) = response_format {
            request["response_format"] = format;
        }
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
                Ok(true) => Err(ProviderError::Permanent("request paused".into())),
                Err(error) => Err(ProviderError::Permanent(error.to_string())),
            },
            None => Ok(()),
        };
        let preparation: Option<&dyn PreparationControl> =
            control.map(|_| &check as &dyn PreparationControl);
        decode_chat_response(&self.http.request(request, preparation)?)
    }

    #[allow(clippy::too_many_arguments)]
    fn translate_v5_line(
        &self,
        batch: &TranslationBatch,
        segment: &auralis_translation::SourceSegment,
        line_index: usize,
        source_line: &str,
        prompt_text: String,
        prepared: &crate::chinese_fidelity_prompt::ChineseFidelityPrompt,
        control: Option<(&dyn RunControl, RunId)>,
    ) -> Result<String, ProviderError> {
        let payload = json!({
            "model": self.profile.model_alias,
            "messages": [{"role": "user", "content": prompt_text}],
            "temperature": self.profile.temperature,
            "top_p": self.profile.top_p,
            "top_k": self.profile.top_k,
            "repeat_penalty": self.profile.repeat_penalty,
            "max_tokens": self.profile.max_tokens_per_line,
            "stream": false,
            "response_format": crate::contextual_prompt_v5::response_format(),
        });
        let rendered_request = serde_json::to_vec(&payload)
            .map_err(|_| ProviderError::Permanent("v5 request cannot be serialized".into()))?;
        let start = InferenceRequestStart {
            request_id: InferenceRequestId::new(Uuid::new_v4())
                .ok_or_else(|| ProviderError::Permanent("invalid inference request ID".into()))?,
            kind: InferenceRequestKind::ChatCompletion,
            run_id: batch.run_id(),
            batch_fingerprint: batch.fingerprint(),
            segment_id: segment.id(),
            line_index: u32::try_from(line_index)
                .map_err(|_| ProviderError::Permanent("line index exceeds journal range".into()))?,
            rendered_request: rendered_request.clone(),
        };
        if let Some(journal) = &self.inference_journal {
            journal
                .begin(&start)
                .map_err(|error| ProviderError::Storage(error.to_string()))?;
        }
        let request = self
            .http
            .client()
            .post(self.endpoint.clone())
            .header(CONTENT_TYPE, "application/json")
            .header(
                "x-auralis-source-sha256",
                format!("{:x}", Sha256::digest(source_line.as_bytes())),
            )
            .body(rendered_request);
        let check = || match control {
            Some((control, run_id)) => match control.pause_requested(run_id) {
                Ok(false) => Ok(()),
                Ok(true) => Err(ProviderError::Permanent("request paused".into())),
                Err(error) => Err(ProviderError::Permanent(error.to_string())),
            },
            None => Ok(()),
        };
        let preparation: Option<&dyn PreparationControl> =
            control.map(|_| &check as &dyn PreparationControl);
        let clock = Instant::now();
        let response = self.http.request_with_status(request, preparation);
        let translated = response
            .as_ref()
            .map_err(|error| ProviderError::Permanent(error.to_string()))
            .and_then(|http| http.body_result())
            .and_then(decode_chat_response)
            .and_then(|candidate| {
                crate::contextual_prompt_v5::decode(&candidate, segment, line_index)
            })
            .and_then(|decoded| prepared.restore(&decoded));
        if let Some(journal) = &self.inference_journal {
            let (prompt_tokens, completion_tokens) = response
                .as_ref()
                .ok()
                .and_then(|http| http.body_result().ok())
                .map_or((None, None), response_usage);
            let outcome = match (&response, &translated) {
                (_, Ok(_)) => InferenceRequestOutcome::ValidatedLine,
                (Err(error), _) if error.to_string().contains("paused") => {
                    InferenceRequestOutcome::Paused
                }
                (Err(error), _)
                    if error.to_string().contains("timeout")
                        || error.to_string().contains("timed out") =>
                {
                    InferenceRequestOutcome::Timeout
                }
                (Err(ProviderError::Transient(_)), _) => InferenceRequestOutcome::TransportFailure,
                (Err(_), _) => InferenceRequestOutcome::OtherPermanent,
                (Ok(http), _) if http.truncated => InferenceRequestOutcome::OtherPermanent,
                (Ok(http), _) if matches!(http.status.as_u16(), 502..=504) => {
                    InferenceRequestOutcome::TransportFailure
                }
                (Ok(http), _) if !http.status.is_success() => {
                    InferenceRequestOutcome::OtherPermanent
                }
                (Ok(_), Err(error))
                    if error.to_string().contains("invalid v5 translation JSON")
                        || error
                            .to_string()
                            .contains("invalid llama.cpp response JSON") =>
                {
                    InferenceRequestOutcome::MalformedCandidate
                }
                (Ok(_), Err(_)) => InferenceRequestOutcome::InvalidCandidate,
            };
            let error_detail = translated.as_ref().err().map(ToString::to_string);
            let finish = InferenceRequestFinish {
                request_id: start.request_id,
                outcome,
                raw_response: response.as_ref().ok().map(|http| http.body.clone()),
                restored_candidate: translated.as_ref().ok().cloned(),
                prompt_tokens,
                completion_tokens,
                elapsed_ms: u64::try_from(clock.elapsed().as_millis()).unwrap_or(u64::MAX),
                error_detail,
            };
            journal
                .finish(&finish)
                .map_err(|error| ProviderError::Storage(error.to_string()))?;
        }
        match response {
            Err(error) => Err(error),
            Ok(http) => match http.body_result() {
                Err(error) => Err(error),
                Ok(_) => translated,
            },
        }
    }

    fn preflight_post(
        &self,
        kind: InferenceRequestKind,
        body: serde_json::Value,
        target: PreflightTarget,
        control: Option<(&dyn RunControl, RunId)>,
    ) -> Result<serde_json::Value, ProviderError> {
        let path = match kind {
            InferenceRequestKind::ApplyTemplate => APPLY_TEMPLATE_PATH,
            InferenceRequestKind::Tokenize => TOKENIZE_PATH,
            InferenceRequestKind::ChatCompletion => {
                return Err(ProviderError::Permanent("invalid preflight kind".into()));
            }
        };
        let endpoint = self
            .base
            .join(path)
            .map_err(|_| ProviderError::Permanent("invalid llama.cpp token endpoint".into()))?;
        let rendered_request = serde_json::to_vec(&body).map_err(|_| {
            ProviderError::Permanent("preflight request cannot be serialized".into())
        })?;
        let start = InferenceRequestStart {
            request_id: InferenceRequestId::new(Uuid::new_v4())
                .ok_or_else(|| ProviderError::Permanent("invalid inference request ID".into()))?,
            kind,
            run_id: target.run_id,
            batch_fingerprint: target.batch_fingerprint,
            segment_id: target.segment_id,
            line_index: target.line_index,
            rendered_request: rendered_request.clone(),
        };
        if let Some(journal) = &self.inference_journal {
            journal
                .begin(&start)
                .map_err(|error| ProviderError::Storage(error.to_string()))?;
        }
        let check = || match control {
            Some((control, run_id)) => match control.pause_requested(run_id) {
                Ok(false) => Ok(()),
                Ok(true) => Err(ProviderError::Permanent("request paused".into())),
                Err(error) => Err(ProviderError::Permanent(error.to_string())),
            },
            None => Ok(()),
        };
        let preparation: Option<&dyn PreparationControl> =
            control.map(|_| &check as &dyn PreparationControl);
        let request = self
            .http
            .client()
            .post(endpoint)
            .header(CONTENT_TYPE, "application/json")
            .body(rendered_request);
        let clock = Instant::now();
        let response = self.http.request_with_status(request, preparation);
        let parsed = match &response {
            Ok(http) => http
                .body_result()
                .and_then(|raw| parse_preflight_json(kind, raw)),
            Err(error) => Err(ProviderError::Permanent(error.to_string())),
        };
        if let Some(journal) = &self.inference_journal {
            let outcome = match (&response, &parsed) {
                (_, Ok(_)) => InferenceRequestOutcome::ParsedPreflightJson,
                (Err(error), _) if error.to_string().contains("paused") => {
                    InferenceRequestOutcome::Paused
                }
                (Err(error), _)
                    if error.to_string().contains("timeout")
                        || error.to_string().contains("timed out") =>
                {
                    InferenceRequestOutcome::Timeout
                }
                (Err(ProviderError::Transient(_)), _) => InferenceRequestOutcome::TransportFailure,
                (Err(_), _) => InferenceRequestOutcome::OtherPermanent,
                (Ok(http), _) if http.truncated => InferenceRequestOutcome::OtherPermanent,
                (Ok(http), _) if matches!(http.status.as_u16(), 502..=504) => {
                    InferenceRequestOutcome::TransportFailure
                }
                (Ok(http), _) if !http.status.is_success() => {
                    InferenceRequestOutcome::OtherPermanent
                }
                (Ok(_), Err(_)) => InferenceRequestOutcome::MalformedCandidate,
            };
            journal
                .finish(&InferenceRequestFinish {
                    request_id: start.request_id,
                    outcome,
                    raw_response: response.as_ref().ok().map(|http| http.body.clone()),
                    restored_candidate: None,
                    prompt_tokens: None,
                    completion_tokens: None,
                    elapsed_ms: u64::try_from(clock.elapsed().as_millis()).unwrap_or(u64::MAX),
                    error_detail: parsed.as_ref().err().map(ToString::to_string),
                })
                .map_err(|error| ProviderError::Storage(error.to_string()))?;
        }
        match response {
            Err(error) => Err(error),
            Ok(http) => match http.body_result() {
                Err(error) => Err(error),
                Ok(_) => parsed,
            },
        }
    }

    fn rendered_chat_tokens(
        &self,
        prompt_text: &str,
        target: PreflightTarget,
        control: Option<(&dyn RunControl, RunId)>,
    ) -> Result<usize, ProviderError> {
        let template = self.preflight_post(
            InferenceRequestKind::ApplyTemplate,
            json!({
                "model": self.profile.model_alias,
                "messages": [{"role": "user", "content": prompt_text}],
                "response_format": crate::contextual_prompt_v5::response_format(),
            }),
            target,
            control,
        )?;
        let rendered = template["prompt"]
            .as_str()
            .filter(|prompt| !prompt.is_empty())
            .ok_or_else(|| {
                ProviderError::Permanent("llama.cpp returned no rendered chat prompt".into())
            })?;
        let tokenized = self.preflight_post(
            InferenceRequestKind::Tokenize,
            json!({"content": rendered, "add_special": false, "parse_special": true}),
            target,
            control,
        )?;
        let tokens = tokenized["tokens"]
            .as_array()
            .filter(|tokens| {
                !tokens.is_empty() && tokens.iter().all(|token| token.as_u64().is_some())
            })
            .ok_or_else(|| {
                ProviderError::Permanent("llama.cpp returned invalid prompt tokens".into())
            })?;
        Ok(tokens.len())
    }

    fn budgeted_v5_prompt(
        &self,
        batch: &TranslationBatch,
        segment: &auralis_translation::SourceSegment,
        line_index: usize,
        prepared: &crate::chinese_fidelity_prompt::ChineseFidelityPrompt,
        control: Option<(&dyn RunControl, RunId)>,
    ) -> Result<String, ProviderError> {
        let target = PreflightTarget {
            run_id: batch.run_id(),
            batch_fingerprint: batch.fingerprint(),
            segment_id: segment.id(),
            line_index: u32::try_from(line_index)
                .map_err(|_| ProviderError::Permanent("line index exceeds journal range".into()))?,
        };
        let context_limit = self.profile.min_context_tokens.ok_or_else(|| {
            ProviderError::Permanent("v5 context profile has no tokenizer context limit".into())
        })?;
        let safety = self.profile.token_safety_margin_tokens.ok_or_else(|| {
            ProviderError::Permanent("v5 context profile has no token safety margin".into())
        })?;
        let available = context_limit
            .checked_sub(self.profile.max_tokens_per_line)
            .and_then(|remaining| remaining.checked_sub(safety))
            .ok_or_else(|| {
                ProviderError::Permanent("v5 response reserve exceeds model context".into())
            })?;
        let mut selected = batch.context().to_vec();
        loop {
            let prompt = crate::contextual_prompt_v5::render(
                segment,
                line_index,
                &selected,
                prepared,
                batch.approved_terms(),
            );
            if self.rendered_chat_tokens(&prompt, target, control)? <= available as usize {
                return Ok(prompt);
            }
            let Some((farthest, _)) = selected.iter().enumerate().max_by_key(|(_, cue)| {
                (cue.id().get().abs_diff(segment.id().get()), cue.id().get())
            }) else {
                return Err(ProviderError::Permanent(
                    "v5 target exceeds rendered token budget".into(),
                ));
            };
            selected.remove(farthest);
        }
    }

    fn translate_controlled(
        &self,
        batch: &TranslationBatch,
        control: Option<(&dyn RunControl, RunId)>,
    ) -> Result<ProviderResponse, ProviderError> {
        if matches!(self.profile.prompt_version, 4 | 5)
            && batch.language_pair().source() != LanguageCode::Chinese
        {
            return Err(ProviderError::Permanent(
                "Chinese fidelity profile requires Chinese source".into(),
            ));
        }
        if matches!(self.profile.prompt_version, 1 | 4) && !batch.context().is_empty() {
            return Err(ProviderError::Permanent(
                "experimental profile has no context support".into(),
            ));
        }
        if self.profile.prompt_version != 3 && !batch.glossary().is_empty() {
            return Err(ProviderError::Permanent(
                "profile does not support glossary entries".into(),
            ));
        }
        if batch.glossary().len() > self.profile.max_glossary_entries {
            return Err(ProviderError::Permanent(
                "glossary exceeds profile entry limit".into(),
            ));
        }
        let glossary_bytes = prompt::glossary_payload_bytes(batch.glossary())
            .map_err(|error| ProviderError::Permanent(error.to_string()))?;
        if glossary_bytes > self.profile.max_glossary_bytes {
            return Err(ProviderError::Permanent(
                "glossary exceeds profile byte limit".into(),
            ));
        }
        if self.profile.prompt_version != 5 && !batch.approved_terms().is_empty() {
            return Err(ProviderError::Permanent(
                "profile does not support approved terms".into(),
            ));
        }
        if batch.approved_terms().len() > self.profile.max_approved_terms_entries {
            return Err(ProviderError::Permanent(
                "approved terms exceed profile entry limit".into(),
            ));
        }
        let terms_bytes = if batch.approved_terms().is_empty() {
            0
        } else {
            crate::contextual_prompt_v5::approved_terms_bytes(batch.approved_terms())?
        };
        if terms_bytes > self.profile.max_approved_terms_bytes {
            return Err(ProviderError::Permanent(
                "approved terms exceed profile byte limit".into(),
            ));
        }
        let context_bytes: usize = batch
            .context()
            .iter()
            .flat_map(|segment| segment.lines())
            .map(String::len)
            .sum();
        if context_bytes > self.profile.max_context_bytes {
            return Err(ProviderError::Permanent(
                "context exceeds profile byte limit".into(),
            ));
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
                        self.translate_line(prepared.text.clone(), source_line, control, None)?;
                    lines.push(prepared.restore(&candidate)?);
                    continue;
                }
                if self.profile.prompt_version == 5 {
                    let prepared = crate::chinese_fidelity_prompt::ChineseFidelityPrompt::prepare(
                        source_line,
                    )?;
                    let prompt_text = if self.profile.token_safety_margin_tokens.is_some() {
                        self.budgeted_v5_prompt(batch, segment, line_index, &prepared, control)?
                    } else {
                        crate::contextual_prompt_v5::render(
                            segment,
                            line_index,
                            batch.context(),
                            &prepared,
                            batch.approved_terms(),
                        )
                    };
                    lines.push(self.translate_v5_line(
                        batch,
                        segment,
                        line_index,
                        source_line,
                        prompt_text,
                        &prepared,
                        control,
                    )?);
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
                    _ => {
                        return Err(ProviderError::Permanent(
                            "unsupported prompt version".into(),
                        ));
                    }
                };
                lines.push(self.translate_line(prompt_text, source_line, control, None)?);
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

fn response_usage(raw: &[u8]) -> (Option<u32>, Option<u32>) {
    let Ok(value) = serde_json::from_slice::<serde_json::Value>(raw) else {
        return (None, None);
    };
    let tokens = |field: &str| {
        value["usage"][field]
            .as_u64()
            .and_then(|count| u32::try_from(count).ok())
    };
    (tokens("prompt_tokens"), tokens("completion_tokens"))
}

fn parse_preflight_json(
    kind: InferenceRequestKind,
    raw: &[u8],
) -> Result<serde_json::Value, ProviderError> {
    let value: serde_json::Value = serde_json::from_slice(raw)
        .map_err(|_| ProviderError::Permanent("invalid llama.cpp token preflight JSON".into()))?;
    match kind {
        InferenceRequestKind::ApplyTemplate
            if value["prompt"]
                .as_str()
                .is_some_and(|prompt| !prompt.is_empty()) => {}
        InferenceRequestKind::Tokenize
            if value["tokens"].as_array().is_some_and(|tokens| {
                !tokens.is_empty() && tokens.iter().all(|token| token.as_u64().is_some())
            }) => {}
        InferenceRequestKind::ApplyTemplate => {
            return Err(ProviderError::Permanent(
                "llama.cpp returned no rendered chat prompt".into(),
            ));
        }
        InferenceRequestKind::Tokenize => {
            return Err(ProviderError::Permanent(
                "llama.cpp returned invalid prompt tokens".into(),
            ));
        }
        InferenceRequestKind::ChatCompletion => {
            return Err(ProviderError::Permanent("invalid preflight kind".into()));
        }
    }
    Ok(value)
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
