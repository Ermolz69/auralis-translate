use crate::{ProviderError, ProviderResponse, TranslationBatch};

pub trait TranslationProvider {
    fn translate(&self, batch: &TranslationBatch) -> Result<ProviderResponse, ProviderError>;
}
