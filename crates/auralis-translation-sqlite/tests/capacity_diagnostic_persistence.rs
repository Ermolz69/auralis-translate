mod support;

use auralis_translation::{
    DiagnosticCode, LanguageCode, LanguagePair, ProviderError, ProviderResponse, SegmentId,
    SourceSegment, TargetSegment, TranslationBatch, TranslationProvider, translate_planned_run,
};
use auralis_translation_sqlite::{SqliteConfig, TranslateDb};
use std::error::Error;
use support::{run_spec, test_directory, translation_spec};

struct ChangedCapacity;

impl TranslationProvider for ChangedCapacity {
    fn translate(&self, batch: &TranslationBatch) -> Result<ProviderResponse, ProviderError> {
        Ok(ProviderResponse {
            schema_version: batch.schema_version(),
            translations: vec![TargetSegment {
                id: batch.targets()[0].id(),
                lines: vec!["Объём накопителя составляет 2230 ГБ.".into()],
            }],
        })
    }
}

#[test]
fn capacity_warning_survives_checkpoint_reopen() -> Result<(), Box<dyn Error>> {
    let directory = test_directory()?;
    let path = directory.join("auralis-translate.sqlite");
    let run = run_spec()?;
    let target_id = SegmentId::new(1).ok_or("invalid target ID")?;
    let batch = TranslationBatch::new(
        run.translation_id,
        run.run_id,
        run.source_hash,
        LanguagePair::new(LanguageCode::Chinese, LanguageCode::Russian)?,
        vec![SourceSegment::new(
            target_id,
            0,
            1000,
            vec!["容量512G。".into()],
        )?],
        vec![],
    )?;
    let mut db = TranslateDb::open(&path, SqliteConfig::default())?;
    db.ensure_translation(&translation_spec()?)?;
    db.begin_attempt(&run, None)?;
    let output = translate_planned_run(&ChangedCapacity, &mut db, &run.blocks, &[batch])?;
    assert_eq!(output[0].lines, ["Объём накопителя составляет 2230 ГБ."]);
    drop(db);

    let db = TranslateDb::open(&path, SqliteConfig::default())?;
    let checkpoints = db.checkpoints(run.run_id)?;
    assert_eq!(checkpoints.len(), 1);
    assert_eq!(checkpoints[0].accepted[0].lines, output[0].lines);
    let warnings = db.diagnostics(run.run_id)?;
    assert!(warnings.iter().any(|warning| {
        warning.diagnostic.code == DiagnosticCode::CapacityMismatch
            && warning.diagnostic.segment_id == target_id
            && warning.diagnostic.line_index == 0
    }));
    drop(db);
    std::fs::remove_dir_all(directory)?;
    Ok(())
}
