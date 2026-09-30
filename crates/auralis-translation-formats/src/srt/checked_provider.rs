use super::{SrtParsePolicy, parser};
use auralis_translation::{
    ProviderError, ProviderResponse, RunControl, TranslationBatch, TranslationDiagnostic,
    TranslationProvider,
};

pub(super) struct SrtCheckedProvider<'a, P> {
    inner: &'a P,
    max_line_bytes: usize,
}

impl<'a, P> SrtCheckedProvider<'a, P> {
    pub(super) fn new(inner: &'a P) -> Self {
        Self {
            inner,
            max_line_bytes: SrtParsePolicy::default().max_line_bytes(),
        }
    }

    fn check(&self, response: ProviderResponse) -> Result<ProviderResponse, ProviderError> {
        for segment in &response.translations {
            for line in &segment.lines {
                if line.len() > self.max_line_bytes || parser::validate_text(line).is_err() {
                    return Err(ProviderError::Permanent(
                        "SRT target line violates supported text grammar".into(),
                    ));
                }
            }
        }
        Ok(response)
    }
}

impl<P: TranslationProvider> TranslationProvider for SrtCheckedProvider<'_, P> {
    fn translate(&self, batch: &TranslationBatch) -> Result<ProviderResponse, ProviderError> {
        self.check(self.inner.translate(batch)?)
    }

    fn translate_with_control(
        &self,
        batch: &TranslationBatch,
        control: &dyn RunControl,
    ) -> Result<ProviderResponse, ProviderError> {
        self.check(self.inner.translate_with_control(batch, control)?)
    }

    fn translate_with_control_and_diagnostics(
        &self,
        batch: &TranslationBatch,
        control: &dyn RunControl,
    ) -> Result<(ProviderResponse, Vec<TranslationDiagnostic>), ProviderError> {
        let (response, diagnostics) = self
            .inner
            .translate_with_control_and_diagnostics(batch, control)?;
        Ok((self.check(response)?, diagnostics))
    }
}
