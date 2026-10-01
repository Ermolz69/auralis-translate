mod support;

use auralis_translation::{
    ApprovedTerm, DiagnosticCode, LanguageCode, LanguagePair, ProviderError, ProviderResponse,
    SegmentId, SourceSegment, TargetSegment, TranslationBatch, TranslationProvider,
    translate_planned_run,
};
use auralis_translation_sqlite::{SqliteConfig, TranslateDb};
use std::error::Error;
use support::{run_spec, test_directory, translation_spec};

struct MissingReviewedName;

impl TranslationProvider for MissingReviewedName {
    fn translate(&self, batch: &TranslationBatch) -> Result<ProviderResponse, ProviderError> {
        Ok(ProviderResponse {
            schema_version: batch.schema_version(),
            translations: vec![TargetSegment {
                id: batch.targets()[0].id(),
                lines: vec!["Заведение открыто.".into()],
            }],
        })
    }
}

#[test]
fn missing_reviewed_name_survives_reopen_and_keeps_original_candidate() -> Result<(), Box<dyn Error>>
{
    let directory = test_directory()?;
    let path = directory.join("auralis-translate.sqlite");
    let run = run_spec()?;
    let id = SegmentId::new(1).ok_or("segment ID")?;
    let batch = TranslationBatch::with_approved_terms(
        run.translation_id,
        run.run_id,
        run.source_hash,
        LanguagePair::new(LanguageCode::Chinese, LanguageCode::Russian)?,
        vec![SourceSegment::new(
            id,
            0,
            1000,
            vec!["海湾餐厅开门了。".into()],
        )?],
        vec![],
        vec![ApprovedTerm::new(
            "海湾餐厅".into(),
            "Хайвань".into(),
            vec![],
            vec![id],
            "fixture-reviewer".into(),
            "fixture-evidence".into(),
        )?],
    )?;
    let mut db = TranslateDb::open(&path, SqliteConfig::default())?;
    db.ensure_translation(&translation_spec()?)?;
    db.begin_attempt(&run, None)?;
    let output = translate_planned_run(&MissingReviewedName, &mut db, &run.blocks, &[batch])?;
    assert_eq!(output[0].lines, ["Заведение открыто."]);
    drop(db);

    let db = TranslateDb::open(&path, SqliteConfig::default())?;
    assert_eq!(
        db.checkpoints(run.run_id)?[0].accepted[0].lines,
        output[0].lines
    );
    let warnings = db.diagnostics(run.run_id)?;
    assert!(warnings.iter().any(|warning| {
        warning.diagnostic.code == DiagnosticCode::ApprovedTermMissing
            && warning.diagnostic.segment_id == id
            && warning.diagnostic.line_index == 0
    }));
    drop(db);
    std::fs::remove_dir_all(directory)?;
    Ok(())
}
