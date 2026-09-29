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

fn observed(source: &str, context: &str, candidate: &str) -> Result<bool, Box<dyn Error>> {
    let target_id = SegmentId::new(1).ok_or("invalid target ID")?;
    let context_id = SegmentId::new(2).ok_or("invalid context ID")?;
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
            vec![
                if context.is_empty() {
                    "旁白。"
                } else {
                    context
                }
                .into(),
            ],
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
        .any(|diagnostic| diagnostic.code == DiagnosticCode::IdentifierMismatch))
}

#[test]
fn confirmed_long_file_loss_and_related_mutations_are_reported() -> Result<(), Box<dyn Error>> {
    let source = "工程 AUR-0002：不要打开这扇门。";
    assert!(observed(source, "", "Не открывайте эту дверь.")?);
    assert!(observed(
        source,
        "",
        "Проект AUR-0003: не открывайте эту дверь."
    )?);
    assert!(observed(
        source,
        "",
        "Проект АУР-0002: не открывайте эту дверь."
    )?);
    assert!(observed(
        source,
        "",
        "Проект AUR-0002, AUR-0002: не открывайте дверь."
    )?);
    assert!(observed("不要打开这扇门。", "", "Не открывайте AUR-0002.")?);
    Ok(())
}

#[test]
fn valid_reordering_and_non_identifier_text_do_not_warn() -> Result<(), Box<dyn Error>> {
    assert!(!observed(
        "工程 AUR-0002 与 DOC-42 已检查。",
        "",
        "DOC-42 и AUR-0002 проверены."
    )?);
    assert!(!observed(
        "列车将在 08:10 出发。",
        "",
        "Поезд отправится в 08:10."
    )?);
    assert!(!observed(
        "不要打开这扇门。",
        "工程 AUR-0002：上一幕。",
        "Не открывайте эту дверь."
    )?);
    assert!(!observed(
        "工程 AUR-0002：不要打开这扇门。",
        "",
        "Проект AUR-0002: не открывайте эту дверь."
    )?);
    assert!(!observed("字段 X-AUR-0002X 不变。", "", "Поле изменено.")?);
    assert!(!observed("项目甲AUR-0002 完成。", "", "Проект завершён.")?);
    assert!(!observed("项目 AUR-0002甲 完成。", "", "Проект завершён.")?);
    Ok(())
}
