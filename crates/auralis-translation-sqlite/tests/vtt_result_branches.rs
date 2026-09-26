mod support;

use auralis_translation::{
    LanguageCode, LanguagePair, ProgressSink, ProviderError, ProviderResponse, ResultId,
    RetryPolicy, ReviewState, RunControl, RunId, RunProgress, SegmentId, SourceHash, TargetSegment,
    TranslationBatch, TranslationProvider,
};
use auralis_translation_formats::vtt::{VttBlockPolicy, VttRunPlan};
use auralis_translation_sqlite::{
    BranchEditSpec, EditSpec, ResultSpec, SegmentSpec, SqliteConfig, TranslateDb,
};
use std::error::Error;
use support::{run_spec, test_directory, translation_spec};

const SOURCE: &[u8] = "WEBVTT\r\n\r\nNOTE provenance\r\nsynthetic\r\n\r\none\r\n00:01.000 --> 00:02.000\r\n你好。\r\n\r\n00:02.000 --> 00:03.000\r\n再见。\r\n".as_bytes();

#[test]
fn historical_webvtt_branch_preserves_protected_bytes_and_base_text_after_reopen()
-> Result<(), Box<dyn Error>> {
    let directory = test_directory()?;
    let database = directory.join("auralis-translate.sqlite");
    let mut translation = translation_spec()?;
    translation.source_hash = SourceHash::digest(SOURCE);
    translation.source_format = "vtt".into();
    let mut run = run_spec()?;
    run.source_hash = translation.source_hash;
    let policy = VttBlockPolicy::new(1).ok_or("invalid policy")?;
    let plan = VttRunPlan::new(
        SOURCE,
        translation.translation_id,
        run.run_id,
        LanguagePair::new(LanguageCode::Chinese, LanguageCode::Russian)?,
        policy,
    )?;
    run.blocks = plan.blocks().to_vec();
    run.parser_version = VttRunPlan::PARSER_VERSION;
    run.policy_fingerprint = VttRunPlan::policy_fingerprint(policy).to_string();
    let segments = plan
        .source_segments()
        .iter()
        .enumerate()
        .map(|(ordinal, segment)| {
            Ok(SegmentSpec {
                id: segment.id,
                ordinal: u32::try_from(ordinal)?,
                cue_label: segment.cue_id.clone(),
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
                parser_version: VttRunPlan::PARSER_VERSION,
            })
        })
        .collect::<Result<Vec<_>, Box<dyn Error>>>()?;
    assert_eq!(segments[0].cue_label.as_deref(), Some("one"));
    assert_eq!(segments[1].cue_label, None);
    let mut db = TranslateDb::open(&database, SqliteConfig::default())?;
    db.ensure_translation(&translation)?;
    db.ensure_segments(
        translation.translation_id,
        u64::try_from(plan.source_len())?,
        &segments,
    )?;
    db.begin_attempt(&run, None)?;
    plan.execute_with_policy(
        &StableProvider,
        &mut db,
        &mut NoProgress,
        &NeverPause,
        RetryPolicy::default(),
    )?;
    let first = db.commit_result(
        &ResultSpec {
            result_id: id(1)?,
            run_id: run.run_id,
            revision: 1,
            source_hash: plan.source_hash(),
            block_fingerprints: plan.block_fingerprints(),
            review_state: ReviewState::NeedsReview,
        },
        &plan,
    )?;
    let checkpoints = db.checkpoints(run.run_id)?;
    let second = db.commit_edit(
        &EditSpec {
            base_result_id: first.result_id,
            result_id: id(2)?,
            segment_id: SegmentId::new(2).ok_or("invalid segment")?,
            lines: vec!["Поздняя правка.".into()],
        },
        &plan,
    )?;
    let request = BranchEditSpec {
        edit: EditSpec {
            base_result_id: first.result_id,
            result_id: id(3)?,
            segment_id: SegmentId::new(1).ok_or("invalid segment")?,
            lines: vec!["Здравствуйте.".into()],
        },
        expected_head_result_id: second.result_id,
    };
    let branch = db.commit_branch_edit(&request, &plan)?;
    assert_eq!(branch.revision, 3);
    assert_eq!(branch.selected[1], first.selected[1]);
    let output = plan.render_selected(&branch.selected)?;
    let expected = "WEBVTT\r\n\r\nNOTE provenance\r\nsynthetic\r\n\r\none\r\n00:01.000 --> 00:02.000\r\nЗдравствуйте.\r\n\r\n00:02.000 --> 00:03.000\r\nРусский 2.\r\n";
    assert_eq!(output, expected.as_bytes());
    assert_eq!(branch.output_hash, SourceHash::digest(&output));
    let malformed = BranchEditSpec {
        edit: EditSpec {
            base_result_id: first.result_id,
            result_id: id(4)?,
            segment_id: request.edit.segment_id,
            lines: vec!["<b>Unsupported</b>".into()],
        },
        expected_head_result_id: branch.result_id,
    };
    assert!(db.commit_branch_edit(&malformed, &plan).is_err());
    assert!(db.result(malformed.edit.result_id).is_err());
    drop(db);
    let mut db = TranslateDb::open(&database, SqliteConfig::default())?;
    assert_eq!(db.result_for_run(run.run_id)?, branch);
    assert_eq!(db.result(first.result_id)?, first);
    assert_eq!(db.result(second.result_id)?, second);
    assert_eq!(db.checkpoints(run.run_id)?, checkpoints);
    assert_eq!(db.commit_branch_edit(&request, &plan)?, branch);
    assert_eq!(db.result_edits(branch.result_id)?.len(), 1);
    assert_eq!(
        db.result_edit_provenance(branch.result_id)?
            .ok_or("missing provenance")?
            .base_result_id,
        first.result_id
    );
    assert_eq!(SourceHash::digest(SOURCE), translation.source_hash);
    drop(db);
    std::fs::remove_dir_all(directory)?;
    Ok(())
}

fn id(index: u32) -> Result<ResultId, Box<dyn Error>> {
    Ok(ResultId::parse(&format!(
        "33333333-3333-4333-8333-{index:012}"
    ))?)
}

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
                    lines: vec![format!("Русский {}.", segment.id())],
                })
                .collect(),
        })
    }
}

struct NoProgress;
impl ProgressSink for NoProgress {
    fn report(&mut self, _: RunProgress) {}
}

struct NeverPause;
impl RunControl for NeverPause {
    fn pause_requested(&self, _: RunId) -> Result<bool, Box<dyn Error>> {
        Ok(false)
    }
}
