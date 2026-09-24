mod support;

use auralis_translation::{RunState, SegmentId, SourceHash, TargetSegment};
use auralis_translation_sqlite::{CheckpointSpec, DbError, RunStop, SqliteConfig, TranslateDb};
use std::error::Error;
use support::{run_spec, test_directory, translation_spec};

#[test]
fn interrupted_run_keeps_only_committed_blocks_and_resumes() -> Result<(), Box<dyn Error>> {
    let directory = test_directory()?;
    let path = directory.join("auralis-translate.sqlite");
    let mut run = run_spec()?;
    run.blocks
        .push(vec![SegmentId::new(2).ok_or("invalid test ID")?]);
    let mut db = TranslateDb::open(&path, SqliteConfig::default())?;
    db.ensure_translation(&translation_spec()?)?;
    db.ensure_run(&run)?;
    let _first_attempt = db.begin_attempt(&run, Some("host-job-one"))?;
    db.commit_checkpoint(&checkpoint(&run, 0, 1, "Первый.")?)?;
    drop(db);

    let mut db = TranslateDb::open(&path, SqliteConfig::default())?;
    assert_eq!(db.run_state(run.run_id)?, RunState::Running);
    assert_eq!(db.checkpoints(run.run_id)?.len(), 1);
    assert!(db.recover_interrupted(run.run_id)?);
    assert!(!db.recover_interrupted(run.run_id)?);
    assert_eq!(db.run_state(run.run_id)?, RunState::Paused);
    let pending = checkpoint(&run, 1, 2, "Второй.")?;
    assert!(matches!(
        db.commit_checkpoint(&pending),
        Err(DbError::Conflict(_))
    ));
    assert_eq!(db.checkpoints(run.run_id)?.len(), 1);
    let second_attempt = db.begin_attempt(&run, Some("host-job-two"))?;
    assert_eq!(db.run_state(run.run_id)?, RunState::Running);
    db.commit_checkpoint(&pending)?;
    assert_eq!(db.checkpoints(run.run_id)?.len(), 2);
    db.stop_attempt(run.run_id, second_attempt, RunStop::Paused, "user paused")?;
    assert_eq!(db.run_state(run.run_id)?, RunState::Paused);
    db.commit_checkpoint(&pending)?;
    assert!(matches!(
        db.stop_attempt(run.run_id, second_attempt, RunStop::Failed, "replay"),
        Err(DbError::Conflict(_))
    ));
    drop(db);
    std::fs::remove_dir_all(directory)?;
    Ok(())
}

#[test]
fn changed_profile_cannot_resume_a_paused_run() -> Result<(), Box<dyn Error>> {
    let directory = test_directory()?;
    let path = directory.join("auralis-translate.sqlite");
    let mut db = TranslateDb::open(&path, SqliteConfig::default())?;
    db.ensure_translation(&translation_spec()?)?;
    let mut run = run_spec()?;
    let attempt = db.begin_attempt(&run, None)?;
    db.stop_attempt(run.run_id, attempt, RunStop::Paused, "manual pause")?;
    run.profile_fingerprint = "changed-profile".into();
    assert!(matches!(
        db.begin_attempt(&run, None),
        Err(DbError::Conflict(_))
    ));
    assert_eq!(db.run_state(run.run_id)?, RunState::Paused);
    drop(db);
    std::fs::remove_dir_all(directory)?;
    Ok(())
}

#[test]
fn pause_before_first_attempt_blocks_start_until_explicit_resume() -> Result<(), Box<dyn Error>> {
    let directory = test_directory()?;
    let path = directory.join("auralis-translate.sqlite");
    let mut db = TranslateDb::open(&path, SqliteConfig::default())?;
    db.ensure_translation(&translation_spec()?)?;
    let run = run_spec()?;
    db.ensure_run(&run)?;
    db.request_pause(run.run_id)?;
    assert_eq!(db.run_state(run.run_id)?, RunState::Paused);
    assert!(matches!(
        db.begin_initial_attempt(&run, None),
        Err(DbError::Conflict(_))
    ));
    assert_eq!(db.run_state(run.run_id)?, RunState::Paused);
    let attempt = db.begin_attempt(&run, None)?;
    assert_eq!(db.run_state(run.run_id)?, RunState::Running);
    db.stop_attempt(run.run_id, attempt, RunStop::Paused, "test complete")?;
    drop(db);
    std::fs::remove_dir_all(directory)?;
    Ok(())
}

fn checkpoint(
    run: &auralis_translation_sqlite::RunSpec,
    block_index: u32,
    segment_id: u32,
    text: &str,
) -> Result<CheckpointSpec, Box<dyn Error>> {
    Ok(CheckpointSpec {
        run_id: run.run_id,
        block_index,
        input_fingerprint: SourceHash::digest(format!("block-{block_index}").as_bytes()),
        accepted: vec![TargetSegment {
            id: SegmentId::new(segment_id).ok_or("invalid test ID")?,
            lines: vec![text.into()],
        }],
        diagnostics_json: "[]".into(),
        attempt_count: 1,
    })
}
