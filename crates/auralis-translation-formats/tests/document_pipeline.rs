use auralis_translation::{
    LanguageCode, LanguagePair, ProviderError, ProviderResponse, RunId, TargetSegment,
    TranslationBatch, TranslationId, TranslationProvider,
};
use auralis_translation_formats::{DocumentTranslationError, translate_document};
use std::cell::Cell;
use std::error::Error;

const SOURCE: &[u8] = include_bytes!("fixtures/plain.srt");

struct FakeProvider {
    calls: Cell<usize>,
}

impl TranslationProvider for FakeProvider {
    fn translate(&self, batch: &TranslationBatch) -> Result<ProviderResponse, ProviderError> {
        self.calls.set(self.calls.get() + 1);
        Ok(ProviderResponse {
            schema_version: batch.schema_version(),
            translations: batch
                .targets()
                .iter()
                .map(|segment| TargetSegment {
                    id: segment.id(),
                    lines: segment.lines().iter().map(|_| "Перевод.".into()).collect(),
                })
                .collect(),
        })
    }
}

#[test]
fn fake_provider_passes_through_full_document_pipeline() -> Result<(), Box<dyn Error>> {
    let provider = FakeProvider {
        calls: Cell::new(0),
    };
    let ids = ids()?;
    let output = translate_document(SOURCE, ids.0, ids.1, ids.2, &provider)?;
    assert_eq!(provider.calls.get(), 1);
    assert!(std::str::from_utf8(&output)?.contains("Перевод."));
    assert!(std::str::from_utf8(SOURCE)?.contains("你好。"));
    assert_ne!(output, SOURCE);
    Ok(())
}

#[test]
fn invalid_source_does_not_call_provider() -> Result<(), Box<dyn Error>> {
    let provider = FakeProvider {
        calls: Cell::new(0),
    };
    let ids = ids()?;
    let result = translate_document(b"WEBVTT\n\n", ids.0, ids.1, ids.2, &provider);
    assert!(matches!(result, Err(DocumentTranslationError::Inspect(_))));
    assert_eq!(provider.calls.get(), 0);
    Ok(())
}

fn ids() -> Result<(TranslationId, RunId, LanguagePair), Box<dyn Error>> {
    Ok((
        TranslationId::parse("11111111-1111-4111-8111-111111111111")?,
        RunId::parse("22222222-2222-4222-8222-222222222222")?,
        LanguagePair::new(LanguageCode::Chinese, LanguageCode::Russian)?,
    ))
}
