use crate::{ProviderError, ProviderResponse, RunControl, TranslationBatch, TranslationDiagnostic};

pub trait TranslationProvider {
    fn translate(&self, batch: &TranslationBatch) -> Result<ProviderResponse, ProviderError>;

    /// Providers with interruptible I/O must observe control while awaiting their response.
    fn translate_with_control(
        &self,
        batch: &TranslationBatch,
        _control: &dyn RunControl,
    ) -> Result<ProviderResponse, ProviderError> {
        self.translate(batch)
    }

    fn translate_with_control_and_diagnostics(
        &self,
        batch: &TranslationBatch,
        control: &dyn RunControl,
    ) -> Result<(ProviderResponse, Vec<TranslationDiagnostic>), ProviderError> {
        self.translate_with_control(batch, control)
            .map(|response| (response, Vec::new()))
    }
}
