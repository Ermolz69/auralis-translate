mod support;

use auralis_translation::{
    DiagnosticCode, LanguageCode, LanguagePair, ProviderError, ProviderResponse, SegmentId,
    SourceSegment, TargetSegment, TranslationBatch, TranslationProvider, translate_planned_run,
};
use auralis_translation_sqlite::{SqliteConfig, TranslateDb};
use std::error::Error;
use support::{run_spec, test_directory, translation_spec};

struct WrongNeighbor;

impl TranslationProvider for WrongNeighbor {
    fn translate(&self, batch: &TranslationBatch) -> Result<ProviderResponse, ProviderError> {
        Ok(ProviderResponse {
            schema_version: batch.schema_version(),
            translations: vec![TargetSegment {
                id: batch.targets()[0].id(),
                lines: vec!["Инженер AUR-0130: Не открывайте эту дверь.".into()],
            }],
        })
    }
}

#[test]
fn time_warning_survives_checkpoint_reopen_with_original_candidate() -> Result<(), Box<dyn Error>> {
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
            vec!["工程 AUR-0129：列车将在 08:10 出发。".into()],
        )?],
        vec![],
    )?;
    let mut db = TranslateDb::open(&path, SqliteConfig::default())?;
    db.ensure_translation(&translation_spec()?)?;
    db.begin_attempt(&run, None)?;
    let output = translate_planned_run(&WrongNeighbor, &mut db, &run.blocks, &[batch])?;
    assert_eq!(
        output[0].lines,
        ["Инженер AUR-0130: Не открывайте эту дверь."]
    );
    drop(db);

    let db = TranslateDb::open(&path, SqliteConfig::default())?;
    let checkpoints = db.checkpoints(run.run_id)?;
    assert_eq!(checkpoints.len(), 1);
    assert_eq!(checkpoints[0].accepted[0].lines, output[0].lines);
    let warnings = db.diagnostics(run.run_id)?;
    assert!(warnings.iter().any(
        |warning| warning.diagnostic.code == DiagnosticCode::TimeMismatch
            && warning.diagnostic.segment_id == target_id
            && warning.diagnostic.line_index == 0
    ));
    drop(db);
    std::fs::remove_dir_all(directory)?;
    Ok(())
}
