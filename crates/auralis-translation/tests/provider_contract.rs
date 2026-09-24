mod support;

use auralis_translation::{
    ContractError, ProviderError, ProviderResponse, TargetSegment, TranslateBatchError,
    TranslationBatch, TranslationId, TranslationProvider, translate_batch,
};
use std::error::Error;
use support::{EchoProvider, sample_batch};

struct StaticProvider(ProviderResponse);

impl TranslationProvider for StaticProvider {
    fn translate(&self, _: &TranslationBatch) -> Result<ProviderResponse, ProviderError> {
        Ok(self.0.clone())
    }
}

#[test]
fn fake_provider_keeps_target_order_and_excludes_context() -> Result<(), Box<dyn Error>> {
    let batch = sample_batch()?;
    let accepted = translate_batch(&EchoProvider, &batch)?;
    assert_eq!(batch.schema_version(), 1);
    assert_eq!(accepted.len(), 2);
    assert_eq!(accepted[0].id, batch.targets()[0].id());
    assert_eq!(accepted[1].id, batch.targets()[1].id());
    assert_eq!(batch.context().len(), 1);
    Ok(())
}

#[test]
fn rejects_untrusted_provider_ids_version_and_lines() -> Result<(), Box<dyn Error>> {
    let batch = sample_batch()?;
    let targets = batch.targets();
    let good = vec![
        TargetSegment {
            id: targets[0].id(),
            lines: vec!["Привет.".into()],
        },
        TargetSegment {
            id: targets[1].id(),
            lines: vec!["Пока.".into()],
        },
    ];
    let responses = [
        (
            ProviderResponse {
                schema_version: 2,
                translations: good.clone(),
            },
            ContractError::UnsupportedSchemaVersion,
        ),
        (
            ProviderResponse {
                schema_version: 1,
                translations: good[..1].to_vec(),
            },
            ContractError::ResponseIds,
        ),
        (
            ProviderResponse {
                schema_version: 1,
                translations: vec![good[0].clone(), good[0].clone()],
            },
            ContractError::ResponseIds,
        ),
        (
            ProviderResponse {
                schema_version: 1,
                translations: vec![
                    good[0].clone(),
                    TargetSegment {
                        id: batch.context()[0].id(),
                        lines: vec!["wrong".into()],
                    },
                ],
            },
            ContractError::ResponseIds,
        ),
        (
            ProviderResponse {
                schema_version: 1,
                translations: vec![
                    good[0].clone(),
                    TargetSegment {
                        id: targets[1].id(),
                        lines: vec!["bad\nline".into()],
                    },
                ],
            },
            ContractError::ResponseLines,
        ),
    ];
    for (response, code) in responses {
        assert!(matches!(
            translate_batch(&StaticProvider(response), &batch),
            Err(TranslateBatchError::Contract(actual)) if actual == code
        ));
    }
    Ok(())
}

#[test]
fn rejects_nil_identity_and_duplicate_context_id() -> Result<(), Box<dyn Error>> {
    assert!(TranslationId::parse("00000000-0000-0000-0000-000000000000").is_err());
    let batch = sample_batch()?;
    let duplicate = TranslationBatch::new(
        batch.translation_id(),
        batch.run_id(),
        batch.source_hash(),
        batch.language_pair(),
        batch.targets().to_vec(),
        vec![batch.targets()[0].clone()],
    );
    assert!(matches!(duplicate, Err(ContractError::DuplicateSegmentId)));
    Ok(())
}
