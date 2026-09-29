use auralis_translation::{
    BlockCheckpoint, CheckpointStore, DiagnosticCode, LanguageCode, LanguagePair, ProviderError,
    ProviderResponse, RunId, SegmentId, SourceHash, SourceSegment, TargetSegment, TranslationBatch,
    TranslationId, TranslationProvider, translate_planned_run,
};
use std::{error::Error, io};

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

fn warns(source: &str, context: &str, candidate: &str) -> Result<bool, Box<dyn Error>> {
    let target_id = SegmentId::new(129).ok_or("invalid target ID")?;
    let context_id = SegmentId::new(130).ok_or("invalid context ID")?;
    let batch = TranslationBatch::new(
        TranslationId::parse("11111111-1111-4111-8111-111111111111")?,
        RunId::parse("22222222-2222-4222-8222-222222222222")?,
        SourceHash::digest(b"source"),
        LanguagePair::new(LanguageCode::Chinese, LanguageCode::Russian)?,
        vec![SourceSegment::new(target_id, 0, 1000, vec![source.into()])?],
        vec![SourceSegment::new(
            context_id,
            1000,
            2000,
            vec![context.into()],
        )?],
    )?;
    let mut store = MemoryStore::default();
    let output = translate_planned_run(
        &FixedProvider(candidate.into()),
        &mut store,
        &[vec![target_id]],
        &[batch],
    )?;
    assert_eq!(output[0].lines, [candidate]);
    assert_eq!(store.0.len(), 1);
    Ok(store.0[0]
        .diagnostics
        .iter()
        .any(|diagnostic| diagnostic.code == DiagnosticCode::TimeMismatch))
}

#[test]
fn accepted_neighbor_content_substitution_warns() -> Result<(), Box<dyn Error>> {
    let source = "工程 AUR-0129：列车将在 08:10 出发。";
    let context = "工程 AUR-0130：不要打开这扇门。";
    assert!(warns(
        source,
        context,
        "Инженер AUR-0130: Не открывайте эту дверь."
    )?);
    assert!(warns(
        source,
        context,
        "Инженер AUR-0129: Поезд отправится в 08:20."
    )?);
    assert!(warns(
        source,
        context,
        "Инженер AUR-0129: Поезд отправится."
    )?);
    assert!(warns("列车将在08:10出发。", context, "Поезд отправится.")?);
    assert!(warns("8:10 和 8:10", context, "8:10")?);
    Ok(())
}

#[test]
fn equivalent_and_context_only_times_do_not_warn() -> Result<(), Box<dyn Error>> {
    let source = "工程 AUR-0257：列车将在 08:10 出发。";
    let context = "工程 AUR-0258：不要打开这扇门。";
    assert!(!warns(
        source,
        context,
        "Инженер AUR-0257: Поезд отправится в 8:10."
    )?);
    assert!(!warns(
        "不要打开这扇门。",
        "列车将在 08:10 出发。",
        "Не открывайте дверь."
    )?);
    assert!(!warns("10:08 和 08:10", context, "08:10 и 10:08")?);
    assert!(!warns("代码 A08:10B", context, "Код изменён.")?);
    assert!(!warns("25:90", context, "Не время.")?);
    Ok(())
}
