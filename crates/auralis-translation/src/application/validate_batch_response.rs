use super::TranslateBatchError;
use crate::domain::{PROVIDER_RESPONSE_SCHEMA_VERSION, valid_line};
use crate::{ContractError, ProviderResponse, TargetSegment, TranslationBatch};
use std::collections::HashMap;

pub(super) fn validate_batch_response(
    batch: &TranslationBatch,
    response: ProviderResponse,
) -> Result<Vec<TargetSegment>, TranslateBatchError> {
    if response.schema_version != PROVIDER_RESPONSE_SCHEMA_VERSION {
        return Err(TranslateBatchError::Contract(
            ContractError::UnsupportedSchemaVersion,
        ));
    }
    let mut by_id = HashMap::new();
    for translated in response.translations {
        if by_id.insert(translated.id, translated).is_some() {
            return Err(TranslateBatchError::Contract(ContractError::ResponseIds));
        }
    }
    if by_id.len() != batch.targets().len() {
        return Err(TranslateBatchError::Contract(ContractError::ResponseIds));
    }
    let mut accepted = Vec::with_capacity(batch.targets().len());
    for target in batch.targets() {
        let translated = by_id
            .remove(&target.id())
            .ok_or(TranslateBatchError::Contract(ContractError::ResponseIds))?;
        if translated.lines.len() != target.lines().len()
            || translated.lines.iter().any(|line| !valid_line(line))
        {
            return Err(TranslateBatchError::Contract(ContractError::ResponseLines));
        }
        accepted.push(translated);
    }
    Ok(accepted)
}
