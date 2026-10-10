mod support;

use auralis_translation::{
    LanguageCode, LanguagePair, ResultId, ReviewState, RunState, SegmentId, SourceHash,
    TargetSegment,
};
use auralis_translation_formats::srt::{SrtBlockPolicy, SrtRunPlan};
use auralis_translation_sqlite::{CheckpointSpec, DbError, ResultSpec, SqliteConfig, TranslateDb};
use rusqlite::{Connection, ErrorCode};
use std::error::Error;
use std::time::Duration;
use support::{run_spec, test_directory, translation_spec};

const SOURCE: &[u8] =
    "1\n00:00:01,000 --> 00:00:02,000\n你好。\n\n2\n00:00:02,000 --> 00:00:03,000\n再见。\n"
        .as_bytes();

#[test]
fn locked_first_checkpoint_leaves_no_prefix_or_result() -> Result<(), Box<dyn Error>> {
    exercise_writer_lock(0)
}

#[test]
fn locked_later_checkpoint_preserves_prefix_and_resumes() -> Result<(), Box<dyn Error>> {
    exercise_writer_lock(1)
}

fn exercise_writer_lock(failed_block: usize) -> Result<(), Box<dyn Error>> {
    let directory = test_directory()?;
    let path = directory.join("auralis-translate.sqlite");
    let mut translation = translation_spec()?;
    translation.source_hash = SourceHash::digest(SOURCE);
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
    assert_eq!(run.blocks.len(), 2);
    let db_config = SqliteConfig::new(Duration::from_millis(50)).ok_or("invalid timeout")?;
    let mut db = TranslateDb::open(&path, db_config)?;
    db.ensure_translation(&translation)?;
    db.begin_attempt(&run, None)?;
    for index in 0..failed_block {
        db.commit_checkpoint(&checkpoint(&run, &plan, index)?)?;
    }
    let committed_prefix = db.checkpoints(run.run_id)?;
    let lock = Connection::open(&path)?;
    lock.execute_batch("BEGIN IMMEDIATE")?;
    let failed = db.commit_checkpoint(&checkpoint(&run, &plan, failed_block)?);
    assert!(
        matches!(&failed, Err(DbError::Sql(rusqlite::Error::SqliteFailure(code, _)))
            if matches!(code.code, ErrorCode::DatabaseBusy | ErrorCode::DatabaseLocked)),
        "expected a SQLite writer-lock failure, got {failed:?}"
    );
    assert_eq!(db.checkpoints(run.run_id)?, committed_prefix);
    assert!(matches!(
        db.result_for_run(run.run_id),
        Err(DbError::Conflict(_))
    ));
    drop(db);
    lock.execute_batch("ROLLBACK")?;
    drop(lock);

    let mut db = TranslateDb::open(&path, db_config)?;
    assert_eq!(db.run_state(run.run_id)?, RunState::Running);
    assert!(db.recover_interrupted(run.run_id)?);
    assert_eq!(db.run_state(run.run_id)?, RunState::Paused);
    assert_eq!(db.checkpoints(run.run_id)?, committed_prefix);
    db.begin_attempt(&run, None)?;
    for index in failed_block..2 {
        db.commit_checkpoint(&checkpoint(&run, &plan, index)?)?;
    }
    assert_eq!(db.checkpoints(run.run_id)?.len(), 2);
    let result_spec = ResultSpec {
        result_id: ResultId::parse("33333333-3333-4333-8333-333333333333")?,
        run_id: run.run_id,
        revision: 1,
        source_hash: plan.source_hash(),
        block_fingerprints: plan.block_fingerprints(),
        review_state: ReviewState::NeedsReview,
    };
    let result = db.commit_result(&result_spec, &plan)?;
    assert_eq!(db.run_state(run.run_id)?, RunState::Validated);
    assert_eq!(result.selected.len(), 2);
    let output = plan.render_selected(&result.selected)?;
    assert_eq!(SourceHash::digest(&output), result.output_hash);
    assert_eq!(SourceHash::digest(SOURCE), translation.source_hash);
    assert!(String::from_utf8(output)?.contains("Русский 2."));
    drop(db);
    std::fs::remove_dir_all(directory)?;
    Ok(())
}

fn checkpoint(
    run: &auralis_translation_sqlite::RunSpec,
    plan: &SrtRunPlan,
    block: usize,
) -> Result<CheckpointSpec, Box<dyn Error>> {
    let id = SegmentId::new(u32::try_from(block + 1)?).ok_or("invalid segment ID")?;
    Ok(CheckpointSpec {
        run_id: run.run_id,
        block_index: u32::try_from(block)?,
        input_fingerprint: plan.block_fingerprints()[block],
        accepted: vec![TargetSegment {
            id,
            lines: vec![format!("Русский {}.", id.get())],
        }],
        diagnostics_json: "[]".into(),
        attempt_count: 1,
    })
}
