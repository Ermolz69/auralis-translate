mod support;

use auralis_translation::{RunId, RunState};
use auralis_translation_sqlite::{DbError, RunStop, SqliteConfig, TranslateDb};
use rusqlite::{Connection, params};
use std::{error::Error, path::Path};
use support::{run_spec, test_directory, translation_spec};

#[test]
fn newer_pause_invalidates_initial_and_paused_resume_guards() -> Result<(), Box<dyn Error>> {
    let directory = test_directory()?;
    let path = directory.join("translate.sqlite");
    let mut db = TranslateDb::open(&path, SqliteConfig::default())?;
    let run = run_spec()?;
    db.ensure_translation(&translation_spec()?)?;
    db.ensure_run(&run)?;
    let initial = db.capture_attempt_start(run.run_id)?;
    let other = TranslateDb::open(&path, SqliteConfig::default())?;
    other.request_pause(run.run_id)?;
    assert!(matches!(
        db.check_attempt_start(initial),
        Err(DbError::PauseRequested)
    ));
    assert!(matches!(
        db.begin_guarded_attempt(&run, Some("old-start"), initial),
        Err(DbError::PauseRequested)
    ));
    let resume = db.capture_attempt_start(run.run_id)?;
    assert_eq!(resume.state(), RunState::Paused);
    other.request_pause(run.run_id)?;
    assert!(matches!(
        db.begin_guarded_attempt(&run, Some("old-resume"), resume),
        Err(DbError::PauseRequested)
    ));
    let current = db.capture_attempt_start(run.run_id)?;
    let poll = auralis_translation_sqlite::AttemptStartControl::new(
        &db,
        current,
        std::time::Duration::from_millis(10),
    )?;
    poll.check()?;
    assert_eq!(current.control_revision(), 2);
    let attempt = db.begin_guarded_attempt(&run, Some("explicit-resume"), current)?;
    db.stop_attempt(run.run_id, attempt, RunStop::Paused, "test pause")?;
    assert_eq!(db.capture_attempt_start(run.run_id)?.control_revision(), 3);
    assert!(!db.pause_requested(run.run_id)?);
    drop(other);
    drop(db);
    let raw = Connection::open(&path)?;
    let attempts: u32 = raw.query_row("SELECT COUNT(*) FROM run_attempts", [], |row| row.get(0))?;
    assert_eq!(attempts, 1);
    drop(raw);
    cleanup(&directory)?;
    Ok(())
}

#[test]
fn competing_start_and_failed_attempt_do_not_reuse_an_older_guard() -> Result<(), Box<dyn Error>> {
    let directory = test_directory()?;
    let path = directory.join("translate.sqlite");
    let mut db = TranslateDb::open(&path, SqliteConfig::default())?;
    let run = run_spec()?;
    db.ensure_translation(&translation_spec()?)?;
    db.ensure_run(&run)?;
    let first = db.capture_attempt_start(run.run_id)?;
    let second = first;
    let attempt = db.begin_guarded_attempt(&run, Some("first"), first)?;
    assert!(matches!(
        db.begin_guarded_attempt(&run, Some("competing"), second),
        Err(DbError::Conflict(_))
    ));
    db.stop_attempt(run.run_id, attempt, RunStop::Failed, "test failure")?;
    assert!(matches!(
        db.begin_guarded_attempt(&run, Some("delayed"), second),
        Err(DbError::Conflict(_))
    ));
    let current = db.capture_attempt_start(run.run_id)?;
    db.request_pause(run.run_id)?;
    assert!(matches!(
        db.begin_guarded_attempt(&run, Some("paused-failed-retry"), current),
        Err(DbError::PauseRequested)
    ));
    let current = db.capture_attempt_start(run.run_id)?;
    let mut other_run = run_spec()?;
    other_run.run_id = RunId::parse("33333333-3333-4333-8333-333333333333")?;
    assert!(matches!(
        db.begin_guarded_attempt(&other_run, None, current),
        Err(DbError::Conflict(_))
    ));
    db.begin_guarded_attempt(&run, Some("explicit-retry"), current)?;
    drop(db);
    cleanup(&directory)?;
    Ok(())
}

#[test]
fn v4_paused_run_migrates_with_zero_revision_and_retained_inputs() -> Result<(), Box<dyn Error>> {
    let directory = test_directory()?;
    let path = directory.join("v4.sqlite");
    let raw = Connection::open(&path)?;
    for schema in [
        include_str!("../migrations/0001_initial.sql"),
        include_str!("../migrations/0002_pause_request.sql"),
        include_str!("../migrations/0003_result_edit_selections.sql"),
        include_str!("../migrations/0004_deleted_translations.sql"),
    ] {
        raw.execute_batch(schema)?;
    }
    let translation = translation_spec()?;
    let run = run_spec()?;
    raw.execute("INSERT INTO translations (translation_id, source_locator, source_sha256, source_format, source_language, target_language) VALUES (?1, 'source.srt', ?2, 'srt', 'zh', 'ru')", params![translation.translation_id.to_string(), translation.source_hash.to_string()])?;
    raw.execute("INSERT INTO runs (run_id, translation_id, state, source_sha256, profile_fingerprint, parser_version, policy_fingerprint, block_plan_json) VALUES (?1, ?2, 'paused', ?3, ?4, ?5, ?6, '[[1]]')", params![run.run_id.to_string(), run.translation_id.to_string(), run.source_hash.to_string(), run.profile_fingerprint, run.parser_version, run.policy_fingerprint])?;
    raw.pragma_update(None, "user_version", 4)?;
    drop(raw);
    let db = TranslateDb::open(&path, SqliteConfig::default())?;
    assert_eq!(db.schema_version()?, 9);
    let stored = db.run(run.run_id)?;
    assert_eq!(stored.source_hash, run.source_hash);
    assert_eq!(stored.blocks, run.blocks);
    assert_eq!(stored.profile_fingerprint, run.profile_fingerprint);
    assert_eq!(db.capture_attempt_start(run.run_id)?.control_revision(), 0);
    drop(db);
    cleanup(&directory)?;
    Ok(())
}

fn cleanup(directory: &Path) -> Result<(), Box<dyn Error>> {
    let target = directory.canonicalize()?;
    let root = std::env::temp_dir().canonicalize()?;
    assert!(target.starts_with(&root) && target != root);
    assert!(
        target
            .file_name()
            .and_then(|name| name.to_str())
            .is_some_and(|name| name.starts_with("auralis-translate-db-"))
    );
    std::fs::remove_dir_all(target)?;
    Ok(())
}
