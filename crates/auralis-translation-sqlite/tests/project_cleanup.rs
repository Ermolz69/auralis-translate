mod support;

use auralis_translation::{SourceHash, TranslationId};
use auralis_translation_sqlite::{DbError, SqliteConfig, TranslateDb};
use rusqlite::{Connection, params};
use std::error::Error;
use support::{run_spec, test_directory, translation_spec};

#[test]
fn project_cleanup_removes_related_records_and_prevents_resurrection() -> Result<(), Box<dyn Error>>
{
    let directory = test_directory()?;
    let path = directory.join("translate.sqlite");
    let mut database = TranslateDb::open(&path, SqliteConfig::default())?;
    let translation = translation_spec()?;
    let run = run_spec()?;
    database.ensure_translation(&translation)?;
    database.ensure_run(&run)?;
    let survivor = TranslationId::parse("33333333-3333-4333-8333-333333333333")?;
    let mut other = translation_spec()?;
    other.translation_id = survivor;
    other.project_id = Some("project-2".into());
    database.ensure_translation(&other)?;

    let connection = Connection::open(&path)?;
    connection.pragma_update(None, "foreign_keys", true)?;
    let id = translation.translation_id.to_string();
    let run_id = run.run_id.to_string();
    let result_id = "44444444-4444-4444-8444-444444444444";
    connection.execute(
        "INSERT INTO segments (translation_id, segment_id, ordinal, cue_label, start_ms, end_ms,
         source_lines_json, source_map_json, parser_version)
         VALUES (?1, 1, 0, '1', 1000, 2000, '[\"source\"]', '{}', 1)",
        [&id],
    )?;
    connection.execute(
        "INSERT INTO run_attempts (run_id, host_job_id) VALUES (?1, 'host-job')",
        [&run_id],
    )?;
    connection.execute(
        "INSERT INTO block_checkpoints (run_id, block_index, input_fingerprint,
         accepted_json, diagnostics_json, attempt_count)
         VALUES (?1, 0, 'fingerprint', '[]', '[]', 1)",
        [&run_id],
    )?;
    connection.execute(
        "INSERT INTO diagnostics (run_id, stage, code, detail_json)
         VALUES (?1, 'model', 'warning', '{}')",
        [&run_id],
    )?;
    connection.execute(
        "INSERT INTO segment_edits (translation_id, segment_id, revision, text_lines_json, provenance)
         VALUES (?1, 1, 1, '[\"edit\"]', 'manual')",
        [&id],
    )?;
    connection.execute(
        "INSERT INTO results (result_id, run_id, revision, source_sha256, output_sha256,
         selected_segments_json, structural_evidence_json, review_state)
         VALUES (?1, ?2, 1, ?3, ?4, '[]', '{}', 'ready')",
        params![
            result_id,
            run_id,
            translation.source_hash.to_string(),
            SourceHash::digest(b"output").to_string()
        ],
    )?;
    connection.execute(
        "INSERT INTO result_edit_selections (result_id, translation_id, segment_id, edit_revision)
         VALUES (?1, ?2, 1, 1)",
        params![result_id, id],
    )?;

    assert!(matches!(
        database.delete_project_translation(translation.translation_id, "project-2"),
        Err(DbError::Conflict(_))
    ));
    assert!(database.delete_project_translation(translation.translation_id, "project-1")?);
    assert!(!database.delete_project_translation(translation.translation_id, "project-1")?);
    assert!(matches!(
        database.delete_project_translation(translation.translation_id, "project-2"),
        Err(DbError::Conflict(_))
    ));
    assert!(matches!(
        database.ensure_translation(&translation),
        Err(DbError::Conflict(_))
    ));
    assert_eq!(
        database.translation(survivor)?.project_id.as_deref(),
        Some("project-2")
    );
    for table in [
        "segments",
        "runs",
        "run_attempts",
        "block_checkpoints",
        "results",
        "segment_edits",
        "result_edit_selections",
        "diagnostics",
    ] {
        let count: i64 =
            connection.query_row(&format!("SELECT COUNT(*) FROM {table}"), [], |row| {
                row.get(0)
            })?;
        assert_eq!(count, 0, "{table} retained a deleted translation record");
    }
    let violations: i64 =
        connection.query_row("SELECT COUNT(*) FROM pragma_foreign_key_check", [], |row| {
            row.get(0)
        })?;
    assert_eq!(violations, 0);

    let never_registered = TranslationId::parse("55555555-5555-4555-8555-555555555555")?;
    assert!(!database.delete_project_translation(never_registered, "project-1")?);
    let mut stale = translation_spec()?;
    stale.translation_id = never_registered;
    assert!(matches!(
        database.ensure_translation(&stale),
        Err(DbError::Conflict(_))
    ));
    drop(connection);
    drop(database);
    std::fs::remove_dir_all(directory)?;
    Ok(())
}
