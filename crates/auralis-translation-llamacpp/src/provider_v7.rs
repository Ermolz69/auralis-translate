use crate::contextual_prompt_v7::{self, ContextLine, Slot};
use crate::provider::{LlamaCppProvider, PreflightTarget};
use crate::{PreparationControl, decode_chat_response::decode_chat_response_with_tail_retry};
use auralis_translation::{
    InferenceRequestFinish, InferenceRequestId, InferenceRequestKind, InferenceRequestOutcome,
    InferenceRequestStart, ProviderError, ProviderResponse, RunControl, RunId, TargetSegment,
    TranslationBatch, TranslationDiagnostic,
};
use reqwest::header::CONTENT_TYPE;
use serde_json::{Value, json};
use sha2::{Digest, Sha256};
use std::ops::Range;
use std::time::Instant;
use uuid::Uuid;

const RESPONSE_SCHEMA_VERSION: u32 = 1;

impl LlamaCppProvider {
    pub(crate) fn translate_v7_batch(
        &self,
        batch: &TranslationBatch,
        control: Option<(&dyn RunControl, RunId)>,
    ) -> Result<(ProviderResponse, Vec<TranslationDiagnostic>), ProviderError> {
        if self.profile.name_proposal_admission_sha256.is_none()
            && batch
                .name_entities()
                .iter()
                .any(|entity| entity.proposal.is_some())
        {
            return Err(ProviderError::NameProposalReviewRequired(
                "name_proposal_review_required: legacy name proposal profile has no pinned admission barrier; use baseline v8 or a fresh guarded run".into(),
            ));
        }
        if batch.name_registry_identity().is_some()
            && self.profile.name_registry_policy_sha256.is_none()
        {
            return Err(ProviderError::Permanent(
                "name registry requires a pinned experimental profile".into(),
            ));
        }
        if batch.targets().len() > self.profile.target_segments_per_block {
            return Err(ProviderError::Permanent(
                "v7 batch exceeds profile target limit".into(),
            ));
        }
        let mut slots = Vec::new();
        for segment in batch.targets() {
            for (line_index, line) in segment.lines().iter().enumerate() {
                slots.push(Slot {
                    segment,
                    line_index,
                    prepared: crate::chinese_fidelity_prompt::ChineseFidelityPrompt::prepare(line)?,
                });
            }
        }
        let translated = self.translate_v7_range(batch, &slots, 0..slots.len(), control)?;
        let mut cursor = 0;
        let mut translations = Vec::with_capacity(batch.targets().len());
        for segment in batch.targets() {
            let end = cursor + segment.lines().len();
            translations.push(TargetSegment {
                id: segment.id(),
                lines: translated[cursor..end].to_vec(),
            });
            cursor = end;
        }
        Ok((
            ProviderResponse {
                schema_version: RESPONSE_SCHEMA_VERSION,
                translations,
            },
            Vec::new(),
        ))
    }

    fn translate_v7_range(
        &self,
        batch: &TranslationBatch,
        slots: &[Slot<'_>],
        range: Range<usize>,
        control: Option<(&dyn RunControl, RunId)>,
    ) -> Result<Vec<String>, ProviderError> {
        let selected_slots = &slots[range.clone()];
        let mut context = batch
            .context()
            .iter()
            .flat_map(|segment| {
                (0..segment.lines().len()).map(move |line_index| ContextLine {
                    segment,
                    line_index,
                })
            })
            .collect::<Vec<_>>();
        context.extend(
            slots
                .iter()
                .enumerate()
                .filter(|(index, _)| !range.contains(index))
                .map(|(_, slot)| ContextLine {
                    segment: slot.segment,
                    line_index: slot.line_index,
                }),
        );
        context.sort_by_key(|line| (line.segment.id().get(), line.line_index));
        if let Some(prompt) = self.budgeted_v7_prompt(batch, selected_slots, context, control)? {
            return self.translate_v7_request(batch, selected_slots, prompt, control);
        }
        if selected_slots.len() == 1 {
            return Err(ProviderError::Permanent(
                "v7 target exceeds rendered token budget".into(),
            ));
        }
        let middle = range.start + selected_slots.len() / 2;
        let mut left = self.translate_v7_range(batch, slots, range.start..middle, control)?;
        left.extend(self.translate_v7_range(batch, slots, middle..range.end, control)?);
        Ok(left)
    }

    fn budgeted_v7_prompt(
        &self,
        batch: &TranslationBatch,
        slots: &[Slot<'_>],
        mut context: Vec<ContextLine<'_>>,
        control: Option<(&dyn RunControl, RunId)>,
    ) -> Result<Option<String>, ProviderError> {
        let first = slots
            .first()
            .ok_or_else(|| ProviderError::Permanent("v7 request has no target slots".into()))?;
        let anchor = PreflightTarget {
            run_id: batch.run_id(),
            batch_fingerprint: batch.fingerprint(),
            segment_id: first.segment.id(),
            line_index: u32::try_from(first.line_index)
                .map_err(|_| ProviderError::Permanent("line index exceeds journal range".into()))?,
        };
        let reserve = self
            .profile
            .max_tokens_per_line
            .checked_mul(u32::try_from(slots.len()).map_err(|_| {
                ProviderError::Permanent("v7 slot count exceeds token range".into())
            })?)
            .ok_or_else(|| ProviderError::Permanent("v7 response reserve overflow".into()))?;
        let context_limit = self.profile.min_context_tokens.ok_or_else(|| {
            ProviderError::Permanent("v7 profile has no tokenizer context limit".into())
        })?;
        let safety = self.profile.token_safety_margin_tokens.ok_or_else(|| {
            ProviderError::Permanent("v7 profile has no token safety margin".into())
        })?;
        let Some(available) = context_limit
            .checked_sub(reserve)
            .and_then(|remaining| remaining.checked_sub(safety))
        else {
            return Ok(None);
        };
        let first_id = first.segment.id().get();
        let last_id = slots
            .last()
            .map(|slot| slot.segment.id().get())
            .unwrap_or(first_id);
        loop {
            let mut prompt = if self.profile.prompt_version == 8 {
                crate::contextual_prompt_v8::render(slots, &context, batch.approved_terms())?
            } else {
                contextual_prompt_v7::render(slots, &context, batch.approved_terms())
            };
            if batch.name_registry_identity().is_some() {
                prompt = crate::render_v8_name_proposals(
                    &prompt,
                    batch.name_entities(),
                    self.profile.max_name_proposals_entries,
                    self.profile.max_name_proposals_bytes,
                )?;
            }
            if self.rendered_chat_tokens_with_format(
                &prompt,
                contextual_prompt_v7::response_format(slots.len()),
                anchor,
                control,
            )? <= available as usize
            {
                return Ok(Some(prompt));
            }
            let Some((farthest, _)) = context.iter().enumerate().max_by_key(|(_, line)| {
                let id = line.segment.id().get();
                let distance = if id < first_id {
                    first_id - id
                } else {
                    id.saturating_sub(last_id)
                };
                (distance, id, line.line_index)
            }) else {
                return Ok(None);
            };
            context.remove(farthest);
        }
    }

    fn translate_v7_request(
        &self,
        batch: &TranslationBatch,
        slots: &[Slot<'_>],
        prompt_text: String,
        control: Option<(&dyn RunControl, RunId)>,
    ) -> Result<Vec<String>, ProviderError> {
        let first = slots
            .first()
            .ok_or_else(|| ProviderError::Permanent("v7 request has no target slots".into()))?;
        let max_tokens = self
            .profile
            .max_tokens_per_line
            .checked_mul(u32::try_from(slots.len()).map_err(|_| {
                ProviderError::Permanent("v7 slot count exceeds token range".into())
            })?)
            .ok_or_else(|| ProviderError::Permanent("v7 response reserve overflow".into()))?;
        let payload = json!({
            "model": self.profile.model_alias,
            "messages": [{"role": "user", "content": &prompt_text}],
            "temperature": self.profile.temperature,
            "top_p": self.profile.top_p,
            "top_k": self.profile.top_k,
            "repeat_penalty": self.profile.repeat_penalty,
            "max_tokens": max_tokens,
            "stream": false,
            "response_format": contextual_prompt_v7::response_format(slots.len()),
        });
        let rendered_request = serde_json::to_vec(&payload)
            .map_err(|_| ProviderError::Permanent("v7 request cannot be serialized".into()))?;
        let start = InferenceRequestStart {
            request_id: InferenceRequestId::new(Uuid::new_v4())
                .ok_or_else(|| ProviderError::Permanent("invalid inference request ID".into()))?,
            kind: InferenceRequestKind::ChatCompletion,
            run_id: batch.run_id(),
            batch_fingerprint: batch.fingerprint(),
            segment_id: first.segment.id(),
            line_index: u32::try_from(first.line_index)
                .map_err(|_| ProviderError::Permanent("line index exceeds journal range".into()))?,
            rendered_request: rendered_request.clone(),
        };
        if let Some(journal) = &self.inference_journal {
            journal
                .begin(&start)
                .map_err(|error| ProviderError::Storage(error.to_string()))?;
        }
        let source = slots
            .iter()
            .map(|slot| slot.segment.lines()[slot.line_index].as_str())
            .collect::<Vec<_>>()
            .join("\n");
        let request = self
            .http
            .client()
            .post(self.endpoint.clone())
            .header(CONTENT_TYPE, "application/json")
            .header(
                "x-auralis-source-sha256",
                format!("{:x}", Sha256::digest(source.as_bytes())),
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
            .and_then(|body| decode_chat_response_with_tail_retry(body, false))
            .and_then(|candidate| {
                contextual_prompt_v7::decode(&normalize_terminal_line_endings(candidate), slots)
            })
            .and_then(|lines| {
                lines
                    .into_iter()
                    .map(|line| {
                        crate::target_text_json_tail::reject_leaked_json_tail(line, false)
                            .and_then(crate::target_text_json_tail::reject_leaked_json_structure)
                    })
                    .collect::<Result<Vec<_>, _>>()
            });
        let admitted = translated
            .as_ref()
            .map_err(|error| ProviderError::Permanent(error.to_string()))
            .and_then(|_| {
                if self.profile.name_proposal_admission_sha256.is_some() {
                    crate::check_name_proposal_admission(&prompt_text)
                } else {
                    Ok(())
                }
            });
        if let Some(journal) = &self.inference_journal {
            let (prompt_tokens, completion_tokens) = response
                .as_ref()
                .ok()
                .and_then(|http| http.body_result().ok())
                .map_or((None, None), crate::provider::response_usage);
            let outcome = match (&response, &admitted) {
                (_, Ok(_)) => InferenceRequestOutcome::ValidatedBatch,
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
                    if error.to_string().contains("invalid v7 translation JSON")
                        || error
                            .to_string()
                            .contains("invalid llama.cpp response JSON") =>
                {
                    InferenceRequestOutcome::MalformedCandidate
                }
                (Ok(_), Err(_)) => InferenceRequestOutcome::InvalidCandidate,
            };
            let restored_candidate = translated
                .as_ref()
                .ok()
                .and_then(|lines| serde_json::to_string(lines).ok());
            journal
                .finish(&InferenceRequestFinish {
                    request_id: start.request_id,
                    outcome,
                    raw_response: response.as_ref().ok().map(|http| http.body.clone()),
                    restored_candidate,
                    prompt_tokens,
                    completion_tokens,
                    elapsed_ms: u64::try_from(clock.elapsed().as_millis()).unwrap_or(u64::MAX),
                    error_detail: admitted.as_ref().err().map(ToString::to_string),
                })
                .map_err(|error| ProviderError::Storage(error.to_string()))?;
        }
        match response {
            Err(error) => Err(error),
            Ok(http) => match http.body_result() {
                Err(error) => Err(error),
                Ok(_) => admitted.and(translated),
            },
        }
    }
}

fn normalize_terminal_line_endings(candidate: String) -> String {
    let Ok(mut value) = serde_json::from_str::<Value>(&candidate) else {
        return candidate;
    };
    let Some(translations) = value.get_mut("translations").and_then(Value::as_array_mut) else {
        return candidate;
    };
    let mut changed = false;
    for translation in translations {
        let Some(text) = translation.get("text").and_then(Value::as_str) else {
            continue;
        };
        let normalized = text.trim_end_matches(['\r', '\n']);
        if normalized.len() != text.len() {
            translation["text"] = Value::String(normalized.to_owned());
            changed = true;
        }
    }
    if changed {
        serde_json::to_string(&value).unwrap_or(candidate)
    } else {
        candidate
    }
}
