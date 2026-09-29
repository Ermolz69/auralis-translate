mod support;

use auralis_translation::{
    DiagnosticCode, LanguageCode, LanguagePair, ProviderError, ProviderResponse, RunControl,
    SegmentId, SourceSegment, TargetSegment, TranslationBatch, TranslationDiagnostic,
    TranslationProvider, translate_planned_run,
};
use auralis_translation_sqlite::{SqliteConfig, TranslateDb};
use std::error::Error;
use support::{run_spec, test_directory, translation_spec};

struct InsertedSourcePrefix;

impl TranslationProvider for InsertedSourcePrefix {
    fn translate(&self, batch: &TranslationBatch) -> Result<ProviderResponse, ProviderError> {
        Ok(ProviderResponse {
            schema_version: batch.schema_version(),
            translations: vec![TargetSegment {
                id: batch.targets()[0].id(),
                lines: vec!["AUR-0002: Не открывайте эту дверь.".into()],
            }],
        })
    }

    fn translate_with_control_and_diagnostics(
        &self,
        batch: &TranslationBatch,
        _: &dyn RunControl,
    ) -> Result<(ProviderResponse, Vec<TranslationDiagnostic>), ProviderError> {
        Ok((
            self.translate(batch)?,
            vec![TranslationDiagnostic {
                code: DiagnosticCode::SourcePrefixInserted,
                segment_id: batch.targets()[0].id(),
                line_index: 0,
            }],
        ))
    }
}

#[test]
fn inserted_prefix_review_flag_survives_checkpoint_reopen() -> Result<(), Box<dyn Error>> {
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
            vec!["工程 AUR-0002：不要打开这扇门。".into()],
        )?],
        vec![],
    )?;
    let mut db = TranslateDb::open(&path, SqliteConfig::default())?;
    db.ensure_translation(&translation_spec()?)?;
    db.begin_attempt(&run, None)?;
    let output = translate_planned_run(&InsertedSourcePrefix, &mut db, &run.blocks, &[batch])?;
    assert_eq!(output[0].lines, ["AUR-0002: Не открывайте эту дверь."]);
    drop(db);

    let reopened = TranslateDb::open(&path, SqliteConfig::default())?;
    let checkpoints = reopened.checkpoints(run.run_id)?;
    assert_eq!(checkpoints.len(), 1);
    assert_eq!(
        checkpoints[0].accepted[0].lines,
        ["AUR-0002: Не открывайте эту дверь."]
    );
    let warnings = reopened.diagnostics(run.run_id)?;
    assert_eq!(warnings.len(), 1);
    assert_eq!(
        warnings[0].diagnostic.code,
        DiagnosticCode::SourcePrefixInserted
    );
    assert_eq!(warnings[0].diagnostic.segment_id, target_id);
    assert_eq!(warnings[0].diagnostic.line_index, 0);
    drop(reopened);
    std::fs::remove_dir_all(directory)?;
    Ok(())
}
