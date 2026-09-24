mod support;

use auralis_translation_sqlite::{DbError, SqliteConfig, TranslateDb};
use rusqlite::Connection;
use std::error::Error;
use support::{run_spec, test_directory, translation_spec};

#[test]
fn migration_and_ensure_are_idempotent_across_reopen() -> Result<(), Box<dyn Error>> {
    let directory = test_directory()?;
    let path = directory.join("auralis-translate.sqlite");
    let mut db = TranslateDb::open(&path, SqliteConfig::default())?;
    assert_eq!(db.schema_version()?, 2);
    let translation = translation_spec()?;
    let run = run_spec()?;
    db.ensure_translation(&translation)?;
    db.ensure_translation(&translation)?;
    db.ensure_run(&run)?;
    db.ensure_run(&run)?;
    drop(db);

    let db = TranslateDb::open(&path, SqliteConfig::default())?;
    assert_eq!(db.schema_version()?, 2);
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
    connection.pragma_update(None, "user_version", 3)?;
    drop(connection);
    assert!(matches!(
        TranslateDb::open(&path, SqliteConfig::default()),
        Err(DbError::UnsupportedSchemaVersion(3))
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
    assert_eq!(db.schema_version()?, 2);
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
