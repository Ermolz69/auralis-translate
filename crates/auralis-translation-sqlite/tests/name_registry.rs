mod support;
use auralis_translation::*;
use auralis_translation_sqlite::*;
use std::{error::Error, num::NonZeroU32};

#[test]
fn durable_registry_is_source_scoped_versioned_and_checkpoint_guarded() -> Result<(), Box<dyn Error>>
{
    let directory = support::test_directory()?;
    let path = directory.join("names.sqlite");
    let mut db = TranslateDb::open(&path, SqliteConfig::default())?;
    let mut translation = support::translation_spec()?;
    translation.source_hash = SourceHash::digest("小王，请进。".as_bytes());
    db.ensure_translation(&translation)?;
    let source = SourceSegment::new(
        SegmentId::new(1).ok_or("id")?,
        1000,
        2000,
        vec!["小王，请进。".into()],
    )?;
    db.ensure_segments(
        translation.translation_id,
        18,
        &[SegmentSpec {
            id: source.id(),
            ordinal: 0,
            cue_label: Some("1".into()),
            start_ms: 1000,
            end_ms: 2000,
            source_lines: source.lines().to_vec(),
            text_ranges: std::iter::once(0..18).collect(),
            parser_version: 1,
        }],
    )?;
    let scenes = SceneMap::new(std::slice::from_ref(&source), &[source.id()])?;
    let registry = extract_source_names(
        translation.translation_id,
        translation.source_hash,
        std::slice::from_ref(&source),
        &scenes,
    )?;
    db.append_name_registry(&registry, &scenes, None)?;
    db.append_name_registry(&registry, &scenes, None)?;
    let mut run = support::run_spec()?;
    run.source_hash = translation.source_hash;
    db.ensure_run(&run)?;
    db.bind_name_registry(run.run_id, &registry)?;
    let attempt = db.begin_attempt(&run, None)?;
    let checkpoint = CheckpointSpec {
        run_id: run.run_id,
        block_index: 0,
        input_fingerprint: SourceHash::digest(b"names-v1"),
        accepted: vec![TargetSegment {
            id: source.id(),
            lines: vec!["Сяо Ван, входите.".into()],
        }],
        diagnostics_json: "[]".into(),
        attempt_count: 1,
    };
    db.commit_checkpoint(&checkpoint)?;
    drop(db);
    let mut db = TranslateDb::open(&path, SqliteConfig::default())?;
    assert_eq!(
        db.name_registry_for_run(run.run_id)?,
        Some(registry.clone())
    );
    assert_eq!(db.checkpoints(run.run_id)?.len(), 1);
    let mut entities = registry.entries().to_vec();
    entities[0].proposal = Some(NameProposal {
        russian: "Сяо Ван".into(),
        origin: NameProposalOrigin::Algorithm,
        evidence_id: "source-only-ai-proposal".into(),
        reviewer_id: None,
    });
    entities[0].revision = NonZeroU32::new(2).ok_or("revision")?;
    let revised = NameRegistry::new(
        registry.translation_id(),
        registry.source_hash(),
        registry.scene_hash(),
        registry.policy_id().into(),
        NonZeroU32::new(2).ok_or("revision")?,
        entities,
    )?;
    assert!(db.append_name_registry(&revised, &scenes, None).is_err());
    db.append_name_registry(&revised, &scenes, Some(registry.fingerprint()))?;
    assert_eq!(
        db.frozen_name_registry_for_run(run.run_id)?,
        Some(registry.clone())
    );
    assert!(matches!(
        db.name_registry_for_run(run.run_id),
        Err(DbError::Conflict(_))
    ));
    assert!(matches!(
        db.commit_checkpoint(&checkpoint),
        Err(DbError::Conflict(_))
    ));
    assert_eq!(db.checkpoints(run.run_id)?.len(), 1);
    assert!(db.result_for_run(run.run_id).is_err());
    db.stop_attempt(run.run_id, attempt, RunStop::Failed, "registry changed")?;
    drop(db);
    let db = TranslateDb::open(&path, SqliteConfig::default())?;
    assert_eq!(db.name_registry(translation.translation_id)?, Some(revised));
    assert!(
        db.name_registry(TranslationId::parse(
            "33333333-3333-4333-8333-333333333333"
        )?)?
        .is_none()
    );
    drop(db);
    std::fs::remove_dir_all(directory)?;
    Ok(())
}

#[test]
fn rolled_back_revision_is_invisible_and_project_cleanup_cascades() -> Result<(), Box<dyn Error>> {
    let directory = support::test_directory()?;
    let path = directory.join("empty.sqlite");
    let mut db = TranslateDb::open(&path, SqliteConfig::default())?;
    let translation = support::translation_spec()?;
    db.ensure_translation(&translation)?;
    let source = SourceSegment::new(
        SegmentId::new(1).ok_or("id")?,
        1000,
        2000,
        vec!["没有名字。".into()],
    )?;
    db.ensure_segments(
        translation.translation_id,
        15,
        &[SegmentSpec {
            id: source.id(),
            ordinal: 0,
            cue_label: Some("1".into()),
            start_ms: 1000,
            end_ms: 2000,
            source_lines: source.lines().to_vec(),
            text_ranges: std::iter::once(0..15).collect(),
            parser_version: 1,
        }],
    )?;
    let scenes = SceneMap::new(std::slice::from_ref(&source), &[source.id()])?;
    let registry = extract_source_names(
        translation.translation_id,
        translation.source_hash,
        &[source],
        &scenes,
    )?;
    db.append_name_registry(&registry, &scenes, None)?;
    drop(db);
    let connection = rusqlite::Connection::open(&path)?;
    connection.execute_batch("BEGIN IMMEDIATE; INSERT INTO name_registry_revisions SELECT translation_id,2,fingerprint || 'x',payload_json,scene_end_ids_json,created_at FROM name_registry_revisions;")
        .err().ok_or("invalid fingerprint must reject")?;
    connection.execute_batch("ROLLBACK")?;
    drop(connection);
    let mut db = TranslateDb::open(&path, SqliteConfig::default())?;
    assert_eq!(
        db.name_registry(translation.translation_id)?,
        Some(registry)
    );
    db.delete_project_translation(translation.translation_id, "project-1")?;
    assert!(db.name_registry(translation.translation_id)?.is_none());
    drop(db);
    std::fs::remove_dir_all(directory)?;
    Ok(())
}
