use super::{LlamaCppProvider, PreflightTarget};
use crate::PreparationControl;
use auralis_translation::{
    InferenceRequestFinish, InferenceRequestId, InferenceRequestKind, InferenceRequestOutcome,
    InferenceRequestStart, ProviderError, RunControl, RunId, TranslationBatch,
};
use reqwest::header::CONTENT_TYPE;
use serde_json::json;
use std::time::Instant;
use uuid::Uuid;

const APPLY_TEMPLATE_PATH: &str = "/apply-template";
const TOKENIZE_PATH: &str = "/tokenize";
const COUNT_INPUT_TOKENS_PATH: &str = "/v1/chat/completions/input_tokens";
const EXACT_COUNT_RUNTIME_BUILD: &str = "b10977-0ecb159c9";

impl LlamaCppProvider {
    pub(crate) fn preflight_post(
        &self,
        kind: InferenceRequestKind,
        body: serde_json::Value,
        target: PreflightTarget,
        control: Option<(&dyn RunControl, RunId)>,
    ) -> Result<serde_json::Value, ProviderError> {
        let path = match kind {
            InferenceRequestKind::ApplyTemplate => APPLY_TEMPLATE_PATH,
            InferenceRequestKind::Tokenize => TOKENIZE_PATH,
            InferenceRequestKind::CountInputTokens => COUNT_INPUT_TOKENS_PATH,
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
        self.rendered_chat_tokens_with_format(
            prompt_text,
            self.response_format(
                target.segment_id.get(),
                usize::try_from(target.line_index).map_err(|_| {
                    ProviderError::Permanent("line index exceeds platform range".into())
                })?,
            ),
            target,
            control,
        )
    }

    pub(crate) fn rendered_chat_tokens_with_format(
        &self,
        prompt_text: &str,
        response_format: serde_json::Value,
        target: PreflightTarget,
        control: Option<(&dyn RunControl, RunId)>,
    ) -> Result<usize, ProviderError> {
        let chat_body = json!({
            "model": self.profile.model_alias,
            "messages": [{"role": "user", "content": prompt_text}],
            "response_format": response_format,
        });
        if self.profile.runtime_build_info.as_deref() == Some(EXACT_COUNT_RUNTIME_BUILD) {
            let counted = self.preflight_post(
                InferenceRequestKind::CountInputTokens,
                chat_body,
                target,
                control,
            )?;
            return counted["input_tokens"]
                .as_u64()
                .filter(|count| *count > 0)
                .and_then(|count| usize::try_from(count).ok())
                .ok_or_else(|| {
                    ProviderError::Permanent("llama.cpp returned invalid input token count".into())
                });
        }
        let template = self.preflight_post(
            InferenceRequestKind::ApplyTemplate,
            chat_body,
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

    pub(super) fn budgeted_v5_prompt(
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
        InferenceRequestKind::CountInputTokens
            if value["input_tokens"]
                .as_u64()
                .is_some_and(|count| count > 0) => {}
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
        InferenceRequestKind::CountInputTokens => {
            return Err(ProviderError::Permanent(
                "llama.cpp returned invalid input token count".into(),
            ));
        }
        InferenceRequestKind::ChatCompletion => {
            return Err(ProviderError::Permanent("invalid preflight kind".into()));
        }
    }
    Ok(value)
}
