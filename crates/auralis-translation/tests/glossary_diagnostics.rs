use auralis_translation::{
    BlockCheckpoint, CheckpointStore, DiagnosticCode, GlossaryEntry, LanguageCode, LanguagePair,
    ProviderError, ProviderResponse, RunId, SegmentId, SourceHash, SourceSegment, TargetSegment,
    TranslationBatch, TranslationId, TranslationProvider, translate_planned_run,
};
use std::error::Error;
use std::io;

struct FixedProvider(String);

impl TranslationProvider for FixedProvider {
    fn translate(&self, batch: &TranslationBatch) -> Result<ProviderResponse, ProviderError> {
        Ok(ProviderResponse {
            schema_version: batch.schema_version(),
            translations: vec![TargetSegment {
                id: batch.targets()[0].id(),
                lines: vec![self.0.clone()],
            }],
        })
    }
}

#[derive(Default)]
struct MemoryStore(Vec<BlockCheckpoint>);

impl CheckpointStore for MemoryStore {
    type Error = io::Error;

    fn load(&self, _: RunId) -> Result<Vec<BlockCheckpoint>, Self::Error> {
        Ok(self.0.clone())
    }

    fn commit(&mut self, checkpoint: &BlockCheckpoint) -> Result<(), Self::Error> {
        self.0.push(checkpoint.clone());
        Ok(())
    }
}

fn warning_codes(
    source_line: &str,
    context_line: &str,
    translated_line: &str,
) -> Result<Vec<DiagnosticCode>, Box<dyn Error>> {
    let target_id = SegmentId::new(1).ok_or("invalid target ID")?;
    let context_id = SegmentId::new(2).ok_or("invalid context ID")?;
    let target = SourceSegment::new(target_id, 1000, 2000, vec![source_line.into()])?;
    let context = SourceSegment::new(context_id, 2000, 3000, vec![context_line.into()])?;
    let term = GlossaryEntry::new("阿明".into(), "Амин".into(), vec!["Амина".into()], None)?;
    let batch = TranslationBatch::with_glossary(
        TranslationId::parse("11111111-1111-4111-8111-111111111111")?,
        RunId::parse("22222222-2222-4222-8222-222222222222")?,
        SourceHash::digest(b"source"),
        LanguagePair::new(LanguageCode::Chinese, LanguageCode::Russian)?,
        vec![target],
        vec![context],
        vec![term],
    )?;
    let mut store = MemoryStore::default();
    translate_planned_run(
        &FixedProvider(translated_line.into()),
        &mut store,
        &[vec![target_id]],
        &[batch],
    )?;
    Ok(store.0[0]
        .diagnostics
        .iter()
        .map(|diagnostic| diagnostic.code)
        .collect())
}

#[test]
fn missing_target_term_is_advisory_and_allowed_form_satisfies_it() -> Result<(), Box<dyn Error>> {
    assert_eq!(
        warning_codes("阿明来了。", "旁白。", "Он пришёл.")?,
        vec![DiagnosticCode::GlossaryTermMissing]
    );
    assert!(warning_codes("阿明来了。", "旁白。", "Я вижу Амина.")?.is_empty());
    assert!(warning_codes("旁白。", "阿明来了。", "Рассказчик.")?.is_empty());
    Ok(())
}
