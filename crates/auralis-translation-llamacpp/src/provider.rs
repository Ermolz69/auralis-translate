use crate::profile::ModelProfile;
use crate::prompt;
use crate::{RequestControlPolicy, local_http::LocalHttp};
use auralis_translation::{
    DiagnosticCode, InferenceRequestJournal, LanguageCode, ProviderError, ProviderResponse,
    RunControl, RunId, SegmentId, SourceHash, TargetSegment, TranslationBatch,
    TranslationDiagnostic, TranslationProvider,
};
use reqwest::Url;
use std::sync::Arc;
use std::time::Duration;

const CHAT_PATH: &str = "/v1/chat/completions";
const RESPONSE_SCHEMA_VERSION: u32 = 1;

#[derive(Clone, Copy)]
pub(crate) struct PreflightTarget {
    pub run_id: RunId,
    pub batch_fingerprint: SourceHash,
    pub segment_id: SegmentId,
    pub line_index: u32,
}

pub struct LlamaCppProvider {
    pub(crate) http: LocalHttp,
    pub(crate) base: Url,
    pub(crate) endpoint: Url,
    pub(crate) profile: ModelProfile,
    pub(crate) inference_journal: Option<Arc<dyn InferenceRequestJournal>>,
}

mod line;
mod preflight;
mod probe;

impl LlamaCppProvider {
    fn response_format(&self, segment_id: u32, line_index: usize) -> serde_json::Value {
        if self.profile.prompt_version == 6 {
            crate::target_schema_v6::response_format(segment_id, line_index)
        } else {
            crate::contextual_prompt_v5::response_format()
        }
    }

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

    fn translate_controlled(
        &self,
        batch: &TranslationBatch,
        control: Option<(&dyn RunControl, RunId)>,
    ) -> Result<(ProviderResponse, Vec<TranslationDiagnostic>), ProviderError> {
        if matches!(self.profile.prompt_version, 4..=8)
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
        if !matches!(self.profile.prompt_version, 5..=8) && !batch.approved_terms().is_empty() {
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
        if matches!(self.profile.prompt_version, 7 | 8) {
            return self.translate_v7_batch(batch, control);
        }
        let mut translations = Vec::with_capacity(batch.targets().len());
        let mut diagnostics = Vec::new();
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
                if matches!(self.profile.prompt_version, 5 | 6) {
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
                    let (line, inserted_prefix) = self.translate_v5_line(
                        batch,
                        segment,
                        line_index,
                        source_line,
                        prompt_text,
                        &prepared,
                        control,
                    )?;
                    if inserted_prefix {
                        diagnostics.push(TranslationDiagnostic {
                            code: DiagnosticCode::SourcePrefixInserted,
                            segment_id: segment.id(),
                            line_index: u32::try_from(line_index).map_err(|_| {
                                ProviderError::Permanent(
                                    "line index exceeds diagnostic range".into(),
                                )
                            })?,
                        });
                    }
                    lines.push(line);
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
        Ok((
            ProviderResponse {
                schema_version: RESPONSE_SCHEMA_VERSION,
                translations,
            },
            diagnostics,
        ))
    }
}

pub(crate) fn response_usage(raw: &[u8]) -> (Option<u32>, Option<u32>) {
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

impl TranslationProvider for LlamaCppProvider {
    fn translate(&self, batch: &TranslationBatch) -> Result<ProviderResponse, ProviderError> {
        if self.profile.source_prefix_repair || self.profile.source_prefix_repair_v2 {
            return Err(ProviderError::Permanent(
                "source prefix repair requires diagnostic-aware run".into(),
            ));
        }
        self.translate_controlled(batch, None)
            .map(|(response, _)| response)
    }

    fn translate_with_control(
        &self,
        batch: &TranslationBatch,
        control: &dyn RunControl,
    ) -> Result<ProviderResponse, ProviderError> {
        if self.profile.source_prefix_repair || self.profile.source_prefix_repair_v2 {
            return Err(ProviderError::Permanent(
                "source prefix repair requires diagnostic-aware run".into(),
            ));
        }
        self.translate_controlled(batch, Some((control, batch.run_id())))
            .map(|(response, _)| response)
    }

    fn translate_with_control_and_diagnostics(
        &self,
        batch: &TranslationBatch,
        control: &dyn RunControl,
    ) -> Result<(ProviderResponse, Vec<TranslationDiagnostic>), ProviderError> {
        self.translate_controlled(batch, Some((control, batch.run_id())))
    }
}
