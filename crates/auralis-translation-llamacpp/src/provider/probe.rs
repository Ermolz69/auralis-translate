use super::LlamaCppProvider;
use crate::{PreparationControl, ServerReport};
use auralis_translation::ProviderError;

const HEALTH_PATH: &str = "/health";
const PROPS_PATH: &str = "/props";
const MODELS_PATH: &str = "/v1/models";

impl LlamaCppProvider {
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
}
