mod support;

use auralis_translation::{
    LanguageCode, LanguagePair, ProviderError, ProviderResponse, ResultId, ReviewState, SegmentId,
    SourceHash, TargetSegment, TranslationBatch, TranslationProvider,
};
use auralis_translation_formats::srt::{SrtBlockPolicy, SrtRunPlan};
use auralis_translation_sqlite::{
    DbError, EditSelection, EditSpec, ResultSpec, SegmentSpec, SqliteConfig, TranslateDb,
};
use std::error::Error;
use support::{run_spec, test_directory, translation_spec};

const SOURCE: &[u8] = b"1\n00:00:01,000 --> 00:00:02,000\n\xe4\xbd\xa0\xe5\xa5\xbd\xe3\x80\x82\n\n2\n00:00:02,000 --> 00:00:03,000\n\xe5\x86\x8d\xe8\xa7\x81\xe3\x80\x82\n";

struct StableProvider;

impl TranslationProvider for StableProvider {
    fn translate(&self, batch: &TranslationBatch) -> Result<ProviderResponse, ProviderError> {
        Ok(ProviderResponse {
            schema_version: batch.schema_version(),
            translations: batch
                .targets()
                .iter()
                .map(|segment| TargetSegment {
                    id: segment.id(),
                    lines: vec![format!("Перевод {}.", segment.id())],
                })
                .collect(),
        })
    }
}

fn source_map(plan: &SrtRunPlan) -> Result<Vec<SegmentSpec>, Box<dyn Error>> {
    plan.source_segments()
        .iter()
        .enumerate()
        .map(|(index, segment)| {
            Ok(SegmentSpec {
                id: segment.id,
                ordinal: u32::try_from(index)?,
                cue_label: segment.cue_label.clone(),
                start_ms: segment.start_ms,
                end_ms: segment.end_ms,
                source_lines: segment
                    .text_slots
                    .iter()
                    .map(|slot| slot.text.clone())
                    .collect(),
                text_ranges: segment
                    .text_slots
                    .iter()
                    .map(|slot| {
                        Ok(u64::try_from(slot.byte_range.start)?
                            ..u64::try_from(slot.byte_range.end)?)
                    })
                    .collect::<Result<Vec<_>, std::num::TryFromIntError>>()?,
                parser_version: SrtRunPlan::PARSER_VERSION,
            })
        })
        .collect()
}

#[test]
fn manual_edits_create_new_verified_results_and_keep_prior_versions() -> Result<(), Box<dyn Error>>
{
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
        SrtBlockPolicy::new(1).ok_or("invalid block policy")?,
    )?;
    run.blocks = plan.blocks().to_vec();
    let mut db = TranslateDb::open(&path, SqliteConfig::default())?;
    db.ensure_translation(&translation)?;
    db.ensure_segments(
        translation.translation_id,
        u64::try_from(plan.source_len())?,
        &source_map(&plan)?,
    )?;
    db.begin_attempt(&run, None)?;
    plan.execute(&StableProvider, &mut db)?;
    let first_id = ResultId::parse("33333333-3333-4333-8333-333333333333")?;
    let first = db.commit_result(
        &ResultSpec {
            result_id: first_id,
            run_id: run.run_id,
            revision: 1,
            source_hash: plan.source_hash(),
            block_fingerprints: plan.block_fingerprints(),
            review_state: ReviewState::NeedsReview,
        },
        &plan,
    )?;
    let second_id = ResultId::parse("44444444-4444-4444-8444-444444444444")?;
    let first_edit = EditSpec {
        base_result_id: first_id,
        result_id: second_id,
        segment_id: SegmentId::new(1).ok_or("invalid segment ID")?,
        lines: vec!["Здравствуйте.".into()],
    };
    let second = db.commit_edit(&first_edit, &plan)?;
    assert_eq!(second.revision, 2);
    assert_eq!(db.commit_edit(&first_edit, &plan)?, second);
    assert_eq!(db.result(first_id)?, first);
    assert_eq!(
        db.result_edits(second_id)?,
        vec![EditSelection {
            segment_id: first_edit.segment_id,
            revision: 1
        }]
    );
    let third_id = ResultId::parse("55555555-5555-4555-8555-555555555555")?;
    let second_edit = EditSpec {
        base_result_id: second_id,
        result_id: third_id,
        segment_id: SegmentId::new(2).ok_or("invalid segment ID")?,
        lines: vec!["До свидания.".into()],
    };
    let third = db.commit_edit(&second_edit, &plan)?;
    assert_eq!(third.revision, 3);
    assert_eq!(db.result_edits(third_id)?.len(), 2);
    assert_eq!(db.result_for_run(run.run_id)?, third);
    assert_eq!(
        SourceHash::digest(&plan.render_selected(&third.selected)?),
        third.output_hash
    );
    let stale = EditSpec {
        base_result_id: second_id,
        result_id: ResultId::parse("66666666-6666-4666-8666-666666666666")?,
        segment_id: first_edit.segment_id,
        lines: vec!["Старый вариант.".into()],
    };
    assert!(matches!(
        db.commit_edit(&stale, &plan),
        Err(DbError::Conflict(_))
    ));
    let malformed = EditSpec {
        base_result_id: third_id,
        result_id: ResultId::parse("77777777-7777-4777-8777-777777777777")?,
        segment_id: first_edit.segment_id,
        lines: vec!["bad\ncue".into()],
    };
    assert!(matches!(
        db.commit_edit(&malformed, &plan),
        Err(DbError::Verification(_))
    ));
    assert_eq!(db.result_for_run(run.run_id)?, third);
    drop(db);

    let db = TranslateDb::open(&path, SqliteConfig::default())?;
    assert_eq!(db.result(first_id)?, first);
    assert_eq!(db.result(second_id)?, second);
    assert_eq!(db.result(third_id)?, third);
    assert_eq!(db.result_edits(third_id)?.len(), 2);
    drop(db);
    std::fs::remove_dir_all(directory)?;
    Ok(())
}
