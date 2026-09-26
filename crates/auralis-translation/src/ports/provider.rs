use crate::{ProviderError, ProviderResponse, RunControl, TranslationBatch};

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
}
