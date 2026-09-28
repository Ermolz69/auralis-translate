use auralis_translation::ProviderError;
use serde::Deserialize;

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ServerReport {
    pub model_path: String,
    pub model_alias: String,
    pub build_info: String,
    pub context_tokens: u32,
}

#[derive(Deserialize)]
struct HealthResponse {
    status: String,
}

#[derive(Deserialize)]
struct PropsResponse {
    model_path: String,
    model_alias: String,
    build_info: String,
    default_generation_settings: ContextSettings,
}

#[derive(Deserialize)]
struct ContextSettings {
    n_ctx: u32,
}

#[derive(Deserialize)]
struct ModelsResponse {
    data: Vec<ModelEntry>,
}

#[derive(Deserialize)]
struct ModelEntry {
    id: String,
}

impl ServerReport {
    pub(crate) fn parse(health: &[u8], props: &[u8], models: &[u8]) -> Result<Self, ProviderError> {
        let health: HealthResponse = serde_json::from_slice(health)
            .map_err(|_| ProviderError::Permanent("invalid llama.cpp health response".into()))?;
        if health.status != "ok" {
            return Err(ProviderError::Permanent(
                "llama.cpp server is not ready".into(),
            ));
        }
        let props: PropsResponse = serde_json::from_slice(props)
            .map_err(|_| ProviderError::Permanent("invalid llama.cpp props response".into()))?;
        let models: ModelsResponse = serde_json::from_slice(models)
            .map_err(|_| ProviderError::Permanent("invalid llama.cpp models response".into()))?;
        if props.model_path.is_empty()
            || props.model_alias.is_empty()
            || props.build_info.is_empty()
            || props.default_generation_settings.n_ctx == 0
            || models.data.len() != 1
            || models.data[0].id != props.model_alias
        {
            return Err(ProviderError::Permanent(
                "llama.cpp server identity is incomplete".into(),
            ));
        }
        Ok(Self {
            model_path: props.model_path,
            model_alias: props.model_alias,
            build_info: props.build_info,
            context_tokens: props.default_generation_settings.n_ctx,
        })
    }
}
