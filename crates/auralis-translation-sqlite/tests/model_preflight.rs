mod support;

use auralis_translation::RunId;
use auralis_translation_sqlite::{DbError, ModelPreflightOutcome, SqliteConfig, TranslateDb};
use rusqlite::Connection;
use std::error::Error;
use support::{run_spec, test_directory, translation_spec};

#[test]
fn preflight_survives_reopen_without_admitting_an_attempt() -> Result<(), Box<dyn Error>> {
    let directory = test_directory()?;
    let path = directory.join("translate.sqlite");
    let mut db = TranslateDb::open(&path, SqliteConfig::default())?;
    db.ensure_translation(&translation_spec()?)?;
    let run = run_spec()?;
    db.ensure_run(&run)?;
    let old_guard = db.capture_attempt_start(run.run_id)?;
    let id = db.begin_model_preflight(old_guard)?;
    drop(db);

    let mut db = TranslateDb::open(&path, SqliteConfig::default())?;
    let raw = Connection::open(&path)?;
    let (code, detail): (String, String) = raw.query_row(
        "SELECT code, detail_json FROM diagnostics WHERE diagnostic_id = ?1",
        [id],
        |row| Ok((row.get(0)?, row.get(1)?)),
    )?;
    assert_eq!((code.as_str(), detail.as_str()), ("pending", "{}"));
    let attempts: i64 = raw.query_row("SELECT COUNT(*) FROM run_attempts", [], |row| row.get(0))?;
    assert_eq!(attempts, 0);

    let other_run = RunId::parse("33333333-3333-4333-8333-333333333333")?;
    assert!(matches!(
        db.finish_model_preflight(
            other_run,
            id,
            ModelPreflightOutcome::Verified,
            &serde_json::json!({})
        ),
        Err(DbError::Conflict(_))
    ));
    assert!(matches!(
        db.finish_model_preflight(
            run.run_id,
            id,
            ModelPreflightOutcome::Verified,
            &serde_json::json!([])
        ),
        Err(DbError::InvalidSpec(_))
    ));
    db.finish_model_preflight(
        run.run_id,
        id,
        ModelPreflightOutcome::Failed,
        &serde_json::json!({"category": "permanent"}),
    )?;
    assert!(matches!(
        db.finish_model_preflight(
            run.run_id,
            id,
            ModelPreflightOutcome::Verified,
            &serde_json::json!({})
        ),
        Err(DbError::Conflict(_))
    ));

    db.request_pause(run.run_id)?;
    assert!(matches!(
        db.begin_model_preflight(old_guard),
        Err(DbError::PauseRequested)
    ));
    let new_guard = db.capture_attempt_start(run.run_id)?;
    let paused_id = db.begin_model_preflight(new_guard)?;
    db.finish_model_preflight(
        run.run_id,
        paused_id,
        ModelPreflightOutcome::Paused,
        &serde_json::json!({"reason": "pause requested"}),
    )?;
    let records: Vec<(String, String)> = {
        let mut query = raw.prepare(
            "SELECT code, detail_json FROM diagnostics WHERE run_id = ?1 ORDER BY diagnostic_id",
        )?;
        let rows = query.query_map([run.run_id.to_string()], |row| {
            Ok((row.get(0)?, row.get(1)?))
        })?;
        rows.collect::<Result<_, _>>()?
    };
    assert_eq!(records.len(), 2);
    assert_eq!(records[0].0, "failed");
    assert_eq!(records[1].0, "paused");
    assert_eq!(
        db.capture_attempt_start(run.run_id)?.state(),
        auralis_translation::RunState::Paused
    );
    drop(raw);
    drop(db);
    std::fs::remove_dir_all(directory)?;
    Ok(())
}
