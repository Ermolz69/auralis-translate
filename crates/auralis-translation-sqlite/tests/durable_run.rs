mod support;

use auralis_translation::{
    LanguageCode, LanguagePair, ProviderError, ProviderResponse, SegmentId, SourceSegment,
    TargetSegment, TranslationBatch, TranslationProvider, translate_planned_run,
};
use auralis_translation_sqlite::{RunStop, SqliteConfig, TranslateDb};
use std::cell::Cell;
use std::error::Error;
use support::{run_spec, test_directory, translation_spec};

struct CountingProvider {
    calls: Cell<usize>,
    fail_on_call: Option<usize>,
}

impl TranslationProvider for CountingProvider {
    fn translate(&self, batch: &TranslationBatch) -> Result<ProviderResponse, ProviderError> {
        let call = self.calls.get() + 1;
        self.calls.set(call);
        if self.fail_on_call == Some(call) {
            return Err(ProviderError("injected model failure".into()));
        }
        Ok(ProviderResponse {
            schema_version: 1,
            translations: batch
                .targets()
                .iter()
                .map(|source| TargetSegment {
                    id: source.id(),
                    lines: vec![format!("Русский текст {}.", source.id())],
                })
                .collect(),
        })
    }
}

#[test]
fn model_failure_then_resume_skips_durable_block() -> Result<(), Box<dyn Error>> {
    let directory = test_directory()?;
    let path = directory.join("auralis-translate.sqlite");
    let mut run = run_spec()?;
    run.blocks
        .push(vec![SegmentId::new(2).ok_or("invalid test ID")?]);
    let batches = batches(&run)?;
    let mut db = TranslateDb::open(&path, SqliteConfig::default())?;
    db.ensure_translation(&translation_spec()?)?;
    let first_attempt = db.begin_attempt(&run, None)?;
    let first_provider = CountingProvider {
        calls: Cell::new(0),
        fail_on_call: Some(2),
    };
    assert!(translate_planned_run(&first_provider, &mut db, &run.blocks, &batches).is_err());
    assert_eq!(first_provider.calls.get(), 2);
    assert_eq!(db.checkpoints(run.run_id)?.len(), 1);
    db.stop_attempt(run.run_id, first_attempt, RunStop::Failed, "model exited")?;
    drop(db);

    let mut db = TranslateDb::open(&path, SqliteConfig::default())?;
    db.begin_attempt(&run, None)?;
    let second_provider = CountingProvider {
        calls: Cell::new(0),
        fail_on_call: None,
    };
    let output = translate_planned_run(&second_provider, &mut db, &run.blocks, &batches)?;
    assert_eq!(second_provider.calls.get(), 1);
    assert_eq!(output.len(), 2);
    assert_eq!(db.checkpoints(run.run_id)?.len(), 2);
    drop(db);
    std::fs::remove_dir_all(directory)?;
    Ok(())
}

#[test]
fn changed_batch_input_rejects_saved_work_before_model_call() -> Result<(), Box<dyn Error>> {
    let directory = test_directory()?;
    let path = directory.join("auralis-translate.sqlite");
    let run = run_spec()?;
    let original = batches(&run)?;
    let mut db = TranslateDb::open(&path, SqliteConfig::default())?;
    db.ensure_translation(&translation_spec()?)?;
    let attempt = db.begin_attempt(&run, None)?;
    let provider = CountingProvider {
        calls: Cell::new(0),
        fail_on_call: None,
    };
    translate_planned_run(&provider, &mut db, &run.blocks, &original[..1])?;
    db.stop_attempt(run.run_id, attempt, RunStop::Paused, "source review")?;
    let mut changed = original;
    changed[0] = batch(&run, 1, "不同文本")?;
    let provider = CountingProvider {
        calls: Cell::new(0),
        fail_on_call: None,
    };
    assert!(translate_planned_run(&provider, &mut db, &run.blocks, &changed[..1]).is_err());
    assert_eq!(provider.calls.get(), 0);
    drop(db);
    std::fs::remove_dir_all(directory)?;
    Ok(())
}

#[test]
fn incomplete_batch_list_cannot_be_reported_as_complete() -> Result<(), Box<dyn Error>> {
    let directory = test_directory()?;
    let path = directory.join("auralis-translate.sqlite");
    let mut run = run_spec()?;
    run.blocks
        .push(vec![SegmentId::new(2).ok_or("invalid test ID")?]);
    let batches = batches(&run)?;
    let mut db = TranslateDb::open(&path, SqliteConfig::default())?;
    db.ensure_translation(&translation_spec()?)?;
    db.begin_attempt(&run, None)?;
    let provider = CountingProvider {
        calls: Cell::new(0),
        fail_on_call: None,
    };
    assert!(translate_planned_run(&provider, &mut db, &run.blocks, &batches[..1]).is_err());
    assert_eq!(provider.calls.get(), 0);
    assert!(db.checkpoints(run.run_id)?.is_empty());
    drop(db);
    std::fs::remove_dir_all(directory)?;
    Ok(())
}

fn batches(
    run: &auralis_translation_sqlite::RunSpec,
) -> Result<Vec<TranslationBatch>, Box<dyn Error>> {
    Ok(vec![batch(run, 1, "你好。")?, batch(run, 2, "再见。")?])
}

fn batch(
    run: &auralis_translation_sqlite::RunSpec,
    id: u32,
    line: &str,
) -> Result<TranslationBatch, Box<dyn Error>> {
    Ok(TranslationBatch::new(
        run.translation_id,
        run.run_id,
        run.source_hash,
        LanguagePair::new(LanguageCode::Chinese, LanguageCode::Russian)?,
        vec![SourceSegment::new(
            SegmentId::new(id).ok_or("invalid test ID")?,
            0,
            1000,
            vec![line.into()],
        )?],
        vec![],
    )?)
}
