use auralis_translation::{
    ApprovedTerm, BlockCheckpoint, CheckpointStore, DiagnosticCode, LanguageCode, LanguagePair,
    ProviderError, ProviderResponse, RunId, SegmentId, SourceHash, SourceSegment, TargetSegment,
    TranslationBatch, TranslationId, TranslationProvider, translate_planned_run,
};
use std::{error::Error, io};

struct AuthoredProvider;

struct NoFurtherInference;

impl TranslationProvider for NoFurtherInference {
    fn translate(&self, _: &TranslationBatch) -> Result<ProviderResponse, ProviderError> {
        panic!("resume must use the saved accepted blocks")
    }
}

impl TranslationProvider for AuthoredProvider {
    fn translate(&self, batch: &TranslationBatch) -> Result<ProviderResponse, ProviderError> {
        let id = batch.targets()[0].id();
        let lines = match id.get() {
            1 => vec!["Заведение открыто.".into()],
            2 => vec![
                "ХАЙВАНЬ снова открыт.".into(),
                "Другая столовая тоже открыта.".into(),
            ],
            3 => vec!["Мы у Хайваня.".into()],
            4 => vec!["Вечером заведение закрыто.".into()],
            5 => vec!["Друг пришёл.".into()],
            _ => unreachable!(),
        };
        Ok(ProviderResponse {
            schema_version: batch.schema_version(),
            translations: vec![TargetSegment { id, lines }],
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
fn warns_on_missing_reviewed_name_at_both_file_ends_without_rewriting_text()
-> Result<(), Box<dyn Error>> {
    let translation_id = TranslationId::parse("11111111-1111-4111-8111-111111111111")?;
    let run_id = RunId::parse("22222222-2222-4222-8222-222222222222")?;
    let source_hash = SourceHash::digest(b"authored repeated venue");
    let pair = LanguagePair::new(LanguageCode::Chinese, LanguageCode::Russian)?;
    let source_lines = [
        vec!["海湾餐厅开门了。"],
        vec!["海湾餐厅又开门了。", "海湾餐馆也开门了。"],
        vec!["我们在海湾餐厅。"],
        vec!["海湾餐厅晚上关门。"],
        vec!["朋友来了。"],
    ];
    let mut batches = Vec::new();
    let mut planned_ids = Vec::new();
    for (index, lines) in source_lines.into_iter().enumerate() {
        let id = SegmentId::new((index + 1) as u32).ok_or("segment ID")?;
        let target = SourceSegment::new(
            id,
            index as u64 * 1000,
            (index as u64 + 1) * 1000,
            lines.into_iter().map(str::to_owned).collect(),
        )?;
        let context = if index == 4 {
            vec![SourceSegment::new(
                SegmentId::new(6).ok_or("context ID")?,
                5000,
                6000,
                vec!["海湾餐厅很忙。".into()],
            )?]
        } else {
            vec![]
        };
        let batch = if index == 4 {
            TranslationBatch::new(
                translation_id,
                run_id,
                source_hash,
                pair,
                vec![target],
                context,
            )?
        } else {
            let term = ApprovedTerm::new(
                "海湾餐厅".into(),
                "Хайвань".into(),
                vec!["Хайваня".into()],
                vec![id],
                "fixture-reviewer".into(),
                "fixture-evidence".into(),
            )?;
            TranslationBatch::with_approved_terms(
                translation_id,
                run_id,
                source_hash,
                pair,
                vec![target],
                context,
                vec![term],
            )?
        };
        planned_ids.push(vec![id]);
        batches.push(batch);
    }
    let mut store = MemoryStore::default();
    let output = translate_planned_run(&AuthoredProvider, &mut store, &planned_ids, &batches)?;
    assert_eq!(output.len(), 5);
    assert_eq!(output[0].lines, ["Заведение открыто."]);
    assert_eq!(output[3].lines, ["Вечером заведение закрыто."]);
    let flagged = store
        .0
        .iter()
        .flat_map(|checkpoint| &checkpoint.diagnostics)
        .filter(|diagnostic| diagnostic.code == DiagnosticCode::ApprovedTermMissing)
        .map(|diagnostic| (diagnostic.segment_id.get(), diagnostic.line_index))
        .collect::<Vec<_>>();
    assert_eq!(flagged, [(1, 0), (4, 0)]);
    assert!(store.0[1].diagnostics.is_empty());
    assert!(store.0[2].diagnostics.is_empty());
    assert!(store.0[4].diagnostics.is_empty());
    let resumed = translate_planned_run(&NoFurtherInference, &mut store, &planned_ids, &batches)?;
    assert_eq!(resumed, output);
    assert_eq!(store.0.len(), 5);
    Ok(())
}
