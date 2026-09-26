use super::{TranslateBatchError, validate_batch_response::validate_batch_response};
use crate::{RunControl, TargetSegment, TranslationBatch, TranslationProvider};

pub fn translate_batch_with_control(
    provider: &impl TranslationProvider,
    batch: &TranslationBatch,
    control: &dyn RunControl,
) -> Result<Vec<TargetSegment>, TranslateBatchError> {
    let response = provider
        .translate_with_control(batch, control)
        .map_err(TranslateBatchError::Provider)?;
    validate_batch_response(batch, response)
}
