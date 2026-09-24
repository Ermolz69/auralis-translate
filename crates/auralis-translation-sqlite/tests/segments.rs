mod support;

use auralis_translation::SegmentId;
use auralis_translation_sqlite::{DbError, SegmentSpec, SqliteConfig, TranslateDb};
use std::error::Error;
use support::{run_spec, test_directory, translation_spec};

#[test]
fn source_map_survives_reopen_and_conflicting_mapping_is_rejected() -> Result<(), Box<dyn Error>> {
    let directory = test_directory()?;
    let path = directory.join("auralis-translate.sqlite");
    let translation = translation_spec()?;
    let segment = SegmentSpec {
        id: SegmentId::new(1).ok_or("invalid test ID")?,
        ordinal: 0,
        cue_label: Some("1".into()),
        start_ms: 1000,
        end_ms: 2000,
        source_lines: vec!["source".into()],
        text_ranges: std::iter::once(2..8).collect(),
        parser_version: 1,
    };
    let mut db = TranslateDb::open(&path, SqliteConfig::default())?;
    db.ensure_translation(&translation)?;
    let mut missing_srt_label = segment.clone();
    missing_srt_label.cue_label = None;
    assert!(matches!(
        db.ensure_segments(translation.translation_id, 20, &[missing_srt_label]),
        Err(DbError::InvalidSpec(_))
    ));
    db.ensure_segments(
        translation.translation_id,
        20,
        std::slice::from_ref(&segment),
    )?;
    db.ensure_run(&run_spec()?)?;
    drop(db);

    let mut db = TranslateDb::open(&path, SqliteConfig::default())?;
    assert_eq!(
        db.segments(translation.translation_id)?,
        vec![segment.clone()]
    );
    db.ensure_segments(
        translation.translation_id,
        20,
        std::slice::from_ref(&segment),
    )?;
    let mut changed = segment.clone();
    changed.text_ranges = std::iter::once(3..9).collect();
    assert!(matches!(
        db.ensure_segments(translation.translation_id, 20, &[changed]),
        Err(DbError::Conflict(_))
    ));
    let mut invalid = segment.clone();
    invalid.text_ranges = std::iter::once(2..7).collect();
    assert!(matches!(
        db.ensure_segments(translation.translation_id, 20, &[invalid]),
        Err(DbError::InvalidSpec(_))
    ));
    assert_eq!(db.segments(translation.translation_id)?, vec![segment]);
    drop(db);
    std::fs::remove_dir_all(directory)?;
    Ok(())
}
