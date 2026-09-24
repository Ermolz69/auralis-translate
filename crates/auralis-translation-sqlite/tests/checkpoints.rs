mod support;

use auralis_translation::{SegmentId, SourceHash, TargetSegment};
use auralis_translation_sqlite::{CheckpointSpec, DbError, SqliteConfig, TranslateDb};
use rusqlite::Connection;
use std::error::Error;
use support::{run_spec, test_directory, translation_spec};

#[test]
fn committed_block_survives_reopen_and_repetition() -> Result<(), Box<dyn Error>> {
    let directory = test_directory()?;
    let path = directory.join("auralis-translate.sqlite");
    let checkpoint = checkpoint()?;
    let mut db = TranslateDb::open(&path, SqliteConfig::default())?;
    db.ensure_translation(&translation_spec()?)?;
    db.ensure_run(&run_spec()?)?;
    db.begin_attempt(&run_spec()?, None)?;
    db.commit_checkpoint(&checkpoint)?;
    db.commit_checkpoint(&checkpoint)?;
    drop(db);

    let mut db = TranslateDb::open(&path, SqliteConfig::default())?;
    assert_eq!(db.checkpoints(checkpoint.run_id)?, vec![checkpoint.clone()]);
    db.commit_checkpoint(&checkpoint)?;
    drop(db);
    std::fs::remove_dir_all(directory)?;
    Ok(())
}

#[test]
fn conflicting_or_unplanned_block_does_not_change_committed_work() -> Result<(), Box<dyn Error>> {
    let directory = test_directory()?;
    let path = directory.join("auralis-translate.sqlite");
    let mut db = TranslateDb::open(&path, SqliteConfig::default())?;
    db.ensure_translation(&translation_spec()?)?;
    db.ensure_run(&run_spec()?)?;
    db.begin_attempt(&run_spec()?, None)?;
    let checkpoint = checkpoint()?;
    db.commit_checkpoint(&checkpoint)?;

    let mut changed = checkpoint.clone();
    changed.accepted[0].lines = vec!["Другой текст.".into()];
    assert!(matches!(
        db.commit_checkpoint(&changed),
        Err(DbError::Conflict(_))
    ));
    changed.block_index = 1;
    assert!(matches!(
        db.commit_checkpoint(&changed),
        Err(DbError::InvalidSpec(_))
    ));
    changed.block_index = 0;
    changed.accepted[0].id = SegmentId::new(2).ok_or("invalid test ID")?;
    assert!(matches!(
        db.commit_checkpoint(&changed),
        Err(DbError::InvalidSpec(_))
    ));
    assert_eq!(db.checkpoints(checkpoint.run_id)?, vec![checkpoint]);
    drop(db);
    std::fs::remove_dir_all(directory)?;
    Ok(())
}

#[test]
fn rejects_invalid_plan_and_unchecked_text() -> Result<(), Box<dyn Error>> {
    let directory = test_directory()?;
    let path = directory.join("auralis-translate.sqlite");
    let mut db = TranslateDb::open(&path, SqliteConfig::default())?;
    db.ensure_translation(&translation_spec()?)?;
    let mut run = run_spec()?;
    run.blocks.push(run.blocks[0].clone());
    assert!(matches!(db.ensure_run(&run), Err(DbError::InvalidSpec(_))));
    db.ensure_run(&run_spec()?)?;
    db.begin_attempt(&run_spec()?, None)?;
    let mut checkpoint = checkpoint()?;
    checkpoint.accepted[0].lines = vec!["bad\nline".into()];
    assert!(matches!(
        db.commit_checkpoint(&checkpoint),
        Err(DbError::InvalidSpec(_))
    ));
    assert!(db.checkpoints(checkpoint.run_id)?.is_empty());
    drop(db);
    std::fs::remove_dir_all(directory)?;
    Ok(())
}

#[test]
fn malformed_unicode_hash_is_reported_as_corrupt_data() -> Result<(), Box<dyn Error>> {
    let directory = test_directory()?;
    let path = directory.join("auralis-translate.sqlite");
    let mut db = TranslateDb::open(&path, SqliteConfig::default())?;
    db.ensure_translation(&translation_spec()?)?;
    db.begin_attempt(&run_spec()?, None)?;
    let checkpoint = checkpoint()?;
    db.commit_checkpoint(&checkpoint)?;
    drop(db);
    let connection = Connection::open(&path)?;
    connection.execute(
        "UPDATE block_checkpoints SET input_fingerprint = ?1 WHERE run_id = ?2",
        rusqlite::params!["é".repeat(32), checkpoint.run_id.to_string()],
    )?;
    drop(connection);
    let db = TranslateDb::open(&path, SqliteConfig::default())?;
    assert!(matches!(
        db.checkpoints(checkpoint.run_id),
        Err(DbError::CorruptRecord(_))
    ));
    drop(db);
    std::fs::remove_dir_all(directory)?;
    Ok(())
}

fn checkpoint() -> Result<CheckpointSpec, Box<dyn Error>> {
    Ok(CheckpointSpec {
        run_id: run_spec()?.run_id,
        block_index: 0,
        input_fingerprint: SourceHash::digest(b"frozen input"),
        accepted: vec![TargetSegment {
            id: SegmentId::new(1).ok_or("invalid test ID")?,
            lines: vec!["Здравствуйте.".into()],
        }],
        diagnostics_json: "[]".into(),
        attempt_count: 1,
    })
}
