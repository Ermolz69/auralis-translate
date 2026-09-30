use auralis_translation::{
    BlockCheckpoint, CheckpointStore, DiagnosticCode, LanguageCode, LanguagePair, ProviderError,
    ProviderResponse, RunId, SegmentId, SourceHash, SourceSegment, TargetSegment, TranslationBatch,
    TranslationId, TranslationProvider, source_measurement_mismatch, translate_planned_run,
};
use std::{error::Error, io};

#[test]
fn physical_unit_substitutions_and_missing_values_warn() {
    for (source, candidate) in [
        (
            "机重608g，比上代轻60g",
            "Вес 608 гигабайт, легче на 60 гигабайт",
        ),
        ("9W 时只开4个核", "При 9 В работают четыре ядра"),
        ("重240g", "Вес 240 ГБ"),
        ("功耗15W", "Мощность 15 В"),
        ("电池40Wh", "Аккумулятор 40 Вт"),
        ("重240g", "Вес неизвестен"),
        ("重240g、备用60g", "Вес 240 граммов"),
        ("重240g", "Вес 240 граммов и ещё 240 граммов"),
    ] {
        assert!(
            source_measurement_mismatch(source, candidate),
            "{source} / {candidate}"
        );
    }
}

#[test]
fn equivalent_units_and_unrelated_numbers_do_not_warn() {
    for (source, candidate) in [
        ("机重608g，比上代轻60g", "Вес 608 граммов, легче на 60 г"),
        ("9W 时只开4个核", "При 9 Вт работают четыре ядра"),
        ("电池40Wh", "Аккумулятор 40 Вт·ч"),
        ("电压5V", "Напряжение 5 В"),
        ("质量1.5kg", "Масса 1,5 килограмма"),
        ("Z1 Extreme 和 7840U", "Z1 Extreme и 7840U"),
        ("608GB 存储", "Память 608 ГБ"),
        ("40Wh 电池", "Батарея 40 Втч"),
        ("A9W 代码", "Код изменён"),
        ("不是最后一班车", "Это не последний поезд"),
    ] {
        assert!(
            !source_measurement_mismatch(source, candidate),
            "{source} / {candidate}"
        );
    }
}

struct FixedProvider(&'static str);

impl TranslationProvider for FixedProvider {
    fn translate(&self, batch: &TranslationBatch) -> Result<ProviderResponse, ProviderError> {
        Ok(ProviderResponse {
            schema_version: batch.schema_version(),
            translations: vec![TargetSegment {
                id: batch.targets()[0].id(),
                lines: vec![self.0.into()],
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

#[test]
fn accepted_candidate_retains_measurement_warning_on_checkpoint() -> Result<(), Box<dyn Error>> {
    let target_id = SegmentId::new(1).ok_or("invalid target ID")?;
    let batch = TranslationBatch::new(
        TranslationId::parse("11111111-1111-4111-8111-111111111111")?,
        RunId::parse("22222222-2222-4222-8222-222222222222")?,
        SourceHash::digest(b"source"),
        LanguagePair::new(LanguageCode::Chinese, LanguageCode::Russian)?,
        vec![SourceSegment::new(
            target_id,
            1000,
            2000,
            vec!["重量为240g".into()],
        )?],
        vec![SourceSegment::new(
            SegmentId::new(2).ok_or("invalid context ID")?,
            2000,
            3000,
            vec!["电池15W".into()],
        )?],
    )?;
    let mut store = MemoryStore::default();
    let output = translate_planned_run(
        &FixedProvider("Вес составляет 240 гигабайт"),
        &mut store,
        &[vec![target_id]],
        &[batch],
    )?;
    assert_eq!(output[0].lines, ["Вес составляет 240 гигабайт"]);
    assert_eq!(store.0.len(), 1);
    assert!(store.0[0].diagnostics.iter().any(|diagnostic| {
        diagnostic.code == DiagnosticCode::MeasurementMismatch
            && diagnostic.segment_id == target_id
            && diagnostic.line_index == 0
    }));
    Ok(())
}
