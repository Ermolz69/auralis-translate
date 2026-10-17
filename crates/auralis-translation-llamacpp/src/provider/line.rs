use super::{LlamaCppProvider, response_usage};
use crate::{
    PreparationControl,
    decode_chat_response::{decode_chat_response, decode_chat_response_with_tail_retry},
};
use auralis_translation::{
    InferenceRequestFinish, InferenceRequestId, InferenceRequestKind, InferenceRequestOutcome,
    InferenceRequestStart, ProviderError, RunControl, RunId, TranslationBatch,
    source_identifier_mismatch, source_identifiers,
};
use reqwest::header::CONTENT_TYPE;
use serde_json::json;
use sha2::{Digest, Sha256};
use std::time::Instant;
use uuid::Uuid;

impl LlamaCppProvider {
    pub(super) fn translate_line(
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
    pub(super) fn translate_v5_line(
        &self,
        batch: &TranslationBatch,
        segment: &auralis_translation::SourceSegment,
        line_index: usize,
        source_line: &str,
        prompt_text: String,
        prepared: &crate::chinese_fidelity_prompt::ChineseFidelityPrompt,
        control: Option<(&dyn RunControl, RunId)>,
    ) -> Result<(String, bool), ProviderError> {
        let payload = json!({
            "model": self.profile.model_alias,
            "messages": [{"role": "user", "content": prompt_text}],
            "temperature": self.profile.temperature,
            "top_p": self.profile.top_p,
            "top_k": self.profile.top_k,
            "repeat_penalty": self.profile.repeat_penalty,
            "max_tokens": self.profile.max_tokens_per_line,
            "stream": false,
            "response_format": self.response_format(segment.id().get(), line_index),
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
        let restored = response
            .as_ref()
            .map_err(|error| ProviderError::Permanent(error.to_string()))
            .and_then(|http| http.body_result())
            .and_then(|body| {
                decode_chat_response_with_tail_retry(body, self.profile.retry_length_json_tail_once)
            })
            .and_then(|candidate| {
                crate::contextual_prompt_v5::decode(&candidate, segment, line_index)
            })
            .and_then(|decoded| {
                crate::target_text_json_tail::reject_leaked_json_tail(
                    decoded,
                    self.profile.retry_json_tail_once,
                )
            })
            .and_then(|decoded| prepared.restore(&decoded));
        let restored_candidate = restored.as_ref().ok().cloned();
        let (translated, inserted_prefix) = match restored {
            Ok(candidate) => {
                let (candidate, inserted) = if self.profile.source_prefix_repair_v2 {
                    crate::source_prefix_repair::apply_v2(source_line, candidate)
                } else if self.profile.source_prefix_repair {
                    crate::source_prefix_repair::apply(source_line, candidate)
                } else {
                    (candidate, false)
                };
                if self.profile.strict_source_identifiers
                    && (source_identifier_mismatch(source_line, &candidate)
                        || (self.profile.source_prefix_repair_v2
                            && !source_identifiers(source_line).is_empty()
                            && crate::source_prefix_repair::has_mixed_script_code_like(&candidate)))
                {
                    (
                        Err(ProviderError::Permanent(
                            "source identifier mismatch in restored target line".into(),
                        )),
                        false,
                    )
                } else if self.profile.strict_source_times
                    && auralis_translation::source_time_mismatch(source_line, &candidate)
                {
                    (
                        Err(ProviderError::Permanent(
                            "source clock-time mismatch in restored target line".into(),
                        )),
                        false,
                    )
                } else {
                    (Ok(candidate), inserted)
                }
            }
            Err(error) => (Err(error), false),
        };
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
                restored_candidate,
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
                Ok(_) => translated.map(|line| (line, inserted_prefix)),
            },
        }
    }
}
