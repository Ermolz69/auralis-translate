mod support;

use auralis_translation::{
    LanguageCode, LanguagePair, ProviderError, ProviderResponse, ResultId, ReviewState, RunState,
    TargetSegment, TranslationBatch, TranslationProvider,
};
use auralis_translation_formats::srt::{SrtBlockPolicy, SrtRunPlan};
use auralis_translation_sqlite::{DbError, ResultSpec, RunStop, SqliteConfig, TranslateDb};
use std::cell::Cell;
use std::error::Error;
use support::{run_spec, test_directory, translation_spec};

const SOURCE: &[u8] = b"1\r\n00:00:01,000 --> 00:00:02,000\r\n\xe4\xbd\xa0\xe5\xa5\xbd\xe3\x80\x82\r\n\r\n2\r\n00:00:02,000 --> 00:00:03,000\r\n\xe5\x86\x8d\xe8\xa7\x81\xe3\x80\x82\r\n";

struct FailableProvider {
    calls: Cell<usize>,
    fail_on_call: Option<usize>,
}

impl TranslationProvider for FailableProvider {
    fn translate(&self, batch: &TranslationBatch) -> Result<ProviderResponse, ProviderError> {
        let call = self.calls.get() + 1;
        self.calls.set(call);
        if self.fail_on_call == Some(call) {
            return Err(ProviderError::Permanent("injected failure".into()));
        }
        Ok(ProviderResponse {
            schema_version: 1,
            translations: batch
                .targets()
                .iter()
                .map(|segment| TargetSegment {
                    id: segment.id(),
                    lines: vec![format!("Русский {}.", segment.id())],
                })
                .collect(),
        })
    }
}

#[test]
fn renders_complete_copy_only_after_durable_resume() -> Result<(), Box<dyn Error>> {
    let directory = test_directory()?;
    let path = directory.join("auralis-translate.sqlite");
    let mut translation = translation_spec()?;
    translation.source_hash = auralis_translation::SourceHash::digest(SOURCE);
    let mut run = run_spec()?;
    run.source_hash = translation.source_hash;
    let plan = SrtRunPlan::new(
        SOURCE,
        translation.translation_id,
        run.run_id,
        LanguagePair::new(LanguageCode::Chinese, LanguageCode::Russian)?,
        SrtBlockPolicy::new(1).ok_or("invalid test block policy")?,
    )?;
    run.blocks = plan.blocks().to_vec();
    assert_eq!(plan.source_hash(), translation.source_hash);
    let mut db = TranslateDb::open(&path, SqliteConfig::default())?;
    db.ensure_translation(&translation)?;
    let attempt = db.begin_attempt(&run, None)?;
    let provider = FailableProvider {
        calls: Cell::new(0),
        fail_on_call: Some(2),
    };
    assert!(plan.execute(&provider, &mut db).is_err());
    assert_eq!(db.checkpoints(run.run_id)?.len(), 1);
    let mut result = ResultSpec {
        result_id: ResultId::parse("33333333-3333-4333-8333-333333333333")?,
        run_id: run.run_id,
        revision: 1,
        source_hash: plan.source_hash(),
        block_fingerprints: plan.block_fingerprints(),
        review_state: ReviewState::NeedsReview,
    };
    assert!(matches!(
        db.commit_result(&result, &plan),
        Err(DbError::Conflict(_))
    ));
    db.stop_attempt(run.run_id, attempt, RunStop::Failed, "model failed")?;
    drop(db);

    let mut db = TranslateDb::open(&path, SqliteConfig::default())?;
    let attempt = db.begin_attempt(&run, None)?;
    let provider = FailableProvider {
        calls: Cell::new(0),
        fail_on_call: None,
    };
    let output = plan.execute(&provider, &mut db)?;
    assert_eq!(provider.calls.get(), 1);
    assert!(String::from_utf8(output.clone())?.contains("Русский 2."));
    assert_ne!(output, SOURCE);
    assert_eq!(
        auralis_translation::SourceHash::digest(SOURCE),
        translation.source_hash
    );
    db.request_pause(run.run_id)?;
    assert!(matches!(
        db.commit_result(&result, &plan),
        Err(DbError::PauseRequested)
    ));
    assert_eq!(db.run_state(run.run_id)?, RunState::Running);
    db.stop_attempt(run.run_id, attempt, RunStop::Paused, "pause before result")?;
    db.begin_attempt(&run, None)?;
    let committed = db.commit_result(&result, &plan)?;
    assert_eq!(
        committed.output_hash,
        auralis_translation::SourceHash::digest(&output)
    );
    assert_eq!(committed.review_state, ReviewState::NeedsReview);
    assert_eq!(committed.selected.len(), 2);
    assert_eq!(db.run_state(run.run_id)?, RunState::Validated);
    assert_eq!(db.result(result.result_id)?, committed);
    assert_eq!(db.result_for_run(run.run_id)?, committed);
    assert_eq!(db.commit_result(&result, &plan)?, committed);
    result.review_state = ReviewState::Ready;
    assert!(matches!(
        db.commit_result(&result, &plan),
        Err(DbError::Conflict(_))
    ));
    drop(db);
    let db = TranslateDb::open(&path, SqliteConfig::default())?;
    let restored = db.result(result.result_id)?;
    let regenerated = plan.render_selected(&restored.selected)?;
    assert_eq!(
        auralis_translation::SourceHash::digest(&regenerated),
        restored.output_hash
    );
    assert_eq!(regenerated, output);
    drop(db);
    std::fs::remove_dir_all(directory)?;
    Ok(())
}
