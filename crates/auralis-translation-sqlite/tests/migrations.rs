mod support;

use auralis_translation_sqlite::{DbError, SqliteConfig, TranslateDb};
use rusqlite::{Connection, params};
use std::error::Error;
use support::{run_spec, test_directory, translation_spec};

#[test]
fn migration_and_ensure_are_idempotent_across_reopen() -> Result<(), Box<dyn Error>> {
    let directory = test_directory()?;
    let path = directory.join("auralis-translate.sqlite");
    let mut db = TranslateDb::open(&path, SqliteConfig::default())?;
    assert_eq!(db.schema_version()?, 5);
    let translation = translation_spec()?;
    let run = run_spec()?;
    db.ensure_translation(&translation)?;
    db.ensure_translation(&translation)?;
    db.ensure_run(&run)?;
    db.ensure_run(&run)?;
    drop(db);

    let db = TranslateDb::open(&path, SqliteConfig::default())?;
    assert_eq!(db.schema_version()?, 5);
    let stored_translation = db.translation(translation.translation_id)?;
    let stored_run = db.run(run.run_id)?;
    assert_eq!(stored_translation.source_hash, translation.source_hash);
    assert_eq!(
        stored_translation.source_artifact_id,
        translation.source_artifact_id
    );
    assert_eq!(stored_run.translation_id, run.translation_id);
    assert_eq!(stored_run.blocks, run.blocks);
    drop(db);
    let connection = Connection::open(&path)?;
    let translations: u32 =
        connection.query_row("SELECT count(*) FROM translations", [], |row| row.get(0))?;
    let runs: u32 = connection.query_row("SELECT count(*) FROM runs", [], |row| row.get(0))?;
    assert_eq!((translations, runs), (1, 1));
    drop(connection);
    std::fs::remove_dir_all(directory)?;
    Ok(())
}

#[test]
fn conflicting_source_and_run_inputs_fail_without_overwriting() -> Result<(), Box<dyn Error>> {
    let directory = test_directory()?;
    let path = directory.join("auralis-translate.sqlite");
    let mut db = TranslateDb::open(&path, SqliteConfig::default())?;
    let mut translation = translation_spec()?;
    db.ensure_translation(&translation)?;
    translation.source_hash = auralis_translation::SourceHash::digest(b"changed source");
    assert!(matches!(
        db.ensure_translation(&translation),
        Err(DbError::Conflict(_))
    ));

    let mut run = run_spec()?;
    db.ensure_run(&run)?;
    run.profile_fingerprint = "changed profile".into();
    assert!(matches!(db.ensure_run(&run), Err(DbError::Conflict(_))));
    run.source_hash = auralis_translation::SourceHash::digest(b"changed source");
    assert!(matches!(db.ensure_run(&run), Err(DbError::Conflict(_))));
    drop(db);
    std::fs::remove_dir_all(directory)?;
    Ok(())
}

#[test]
fn refuses_database_from_a_newer_schema() -> Result<(), Box<dyn Error>> {
    let directory = test_directory()?;
    let path = directory.join("future.sqlite");
    let connection = Connection::open(&path)?;
    connection.pragma_update(None, "user_version", 6)?;
    drop(connection);
    assert!(matches!(
        TranslateDb::open(&path, SqliteConfig::default()),
        Err(DbError::UnsupportedSchemaVersion(6))
    ));
    std::fs::remove_dir_all(directory)?;
    Ok(())
}

#[test]
fn upgrades_existing_v1_run_without_losing_it() -> Result<(), Box<dyn Error>> {
    let directory = test_directory()?;
    let path = directory.join("v1.sqlite");
    let connection = Connection::open(&path)?;
    connection.execute_batch(include_str!("../migrations/0001_initial.sql"))?;
    connection.pragma_update(None, "user_version", 1)?;
    drop(connection);

    let mut db = TranslateDb::open(&path, SqliteConfig::default())?;
    assert_eq!(db.schema_version()?, 5);
    let translation = translation_spec()?;
    let run = run_spec()?;
    db.ensure_translation(&translation)?;
    db.ensure_run(&run)?;
    assert!(!db.pause_requested(run.run_id)?);
    drop(db);

    let db = TranslateDb::open(&path, SqliteConfig::default())?;
    assert_eq!(
        db.run(run.run_id)?.translation_id,
        translation.translation_id
    );
    drop(db);
    std::fs::remove_dir_all(directory)?;
    Ok(())
}

#[test]
fn upgrades_existing_v2_run_and_adds_edit_selections() -> Result<(), Box<dyn Error>> {
    let directory = test_directory()?;
    let path = directory.join("v2.sqlite");
    let connection = Connection::open(&path)?;
    connection.execute_batch(include_str!("../migrations/0001_initial.sql"))?;
    connection.execute_batch(include_str!("../migrations/0002_pause_request.sql"))?;
    connection.pragma_update(None, "user_version", 2)?;
    let translation = translation_spec()?;
    let run = run_spec()?;
    connection.execute(
        "INSERT INTO translations (translation_id, project_id, source_artifact_id, source_sha256,
            source_format, source_language, target_language) VALUES (?1, ?2, ?3, ?4, 'srt', 'zh', 'ru')",
        params![translation.translation_id.to_string(), translation.project_id,
            translation.source_artifact_id, translation.source_hash.to_string()],
    )?;
    connection.execute(
        "INSERT INTO runs (run_id, translation_id, state, source_sha256, profile_fingerprint,
            parser_version, policy_fingerprint, block_plan_json, pause_requested)
         VALUES (?1, ?2, 'requested', ?3, ?4, ?5, ?6, ?7, 0)",
        params![
            run.run_id.to_string(),
            run.translation_id.to_string(),
            run.source_hash.to_string(),
            run.profile_fingerprint,
            run.parser_version,
            run.policy_fingerprint,
            "[[1]]"
        ],
    )?;
    drop(connection);

    let db = TranslateDb::open(&path, SqliteConfig::default())?;
    assert_eq!(db.schema_version()?, 5);
    assert_eq!(db.run(run.run_id)?.translation_id, run.translation_id);
    let connection = Connection::open(&path)?;
    let table: String = connection.query_row(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'result_edit_selections'",
        [],
        |row| row.get(0),
    )?;
    assert_eq!(table, "result_edit_selections");
    drop(db);
    drop(connection);
    std::fs::remove_dir_all(directory)?;
    Ok(())
}

#[test]
fn upgrades_v3_and_prevents_recreating_deleted_project_translation() -> Result<(), Box<dyn Error>> {
    let directory = test_directory()?;
    let path = directory.join("v3.sqlite");
    let connection = Connection::open(&path)?;
    connection.execute_batch(include_str!("../migrations/0001_initial.sql"))?;
    connection.execute_batch(include_str!("../migrations/0002_pause_request.sql"))?;
    connection.execute_batch(include_str!(
        "../migrations/0003_result_edit_selections.sql"
    ))?;
    connection.pragma_update(None, "user_version", 3)?;
    drop(connection);

    let mut database = TranslateDb::open(&path, SqliteConfig::default())?;
    assert_eq!(database.schema_version()?, 5);
    let translation = translation_spec()?;
    database.ensure_translation(&translation)?;
    assert!(database.delete_project_translation(translation.translation_id, "project-1")?);
    assert!(matches!(
        database.ensure_translation(&translation),
        Err(DbError::Conflict(_))
    ));
    drop(database);
    std::fs::remove_dir_all(directory)?;
    Ok(())
}
