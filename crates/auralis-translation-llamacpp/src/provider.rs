use crate::profile::ModelProfile;
use crate::{RequestControlPolicy, local_http::LocalHttp};
use auralis_translation::{
    InferenceRequestJournal, ProviderError, ProviderResponse, RunControl, RunId, SegmentId,
    SourceHash, TranslationBatch, TranslationDiagnostic, TranslationProvider,
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

mod dispatch;
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
