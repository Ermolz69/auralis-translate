mod support;

use auralis_translation::{
    LanguageCode, LanguagePair, ProgressSink, ProviderError, ProviderResponse, ResultId,
    RetryPolicy, ReviewState, RunControl, RunId, RunProgress, TargetSegment, TranslationBatch,
    TranslationProvider,
};
use auralis_translation_formats::vtt::{VttBlockPolicy, VttRunPlan};
use auralis_translation_sqlite::{
    DbError, ResultSpec, RunStop, SegmentSpec, SqliteConfig, TranslateDb,
};
use std::{cell::Cell, error::Error};
use support::{run_spec, test_directory, translation_spec};

const SOURCE: &[u8] = b"WEBVTT\r\n\r\nNOTE provenance\r\nsynthetic\r\n\r\none\r\n00:01.000 --> 00:02.000\r\n\xe4\xbd\xa0\xe5\xa5\xbd\xe3\x80\x82\r\n\r\n00:02.000 --> 00:03.000\r\n\xe5\x86\x8d\xe8\xa7\x81\xe3\x80\x82\r\n";

struct FailableProvider {
    calls: Cell<usize>,
    fail_on_call: Option<usize>,
}

impl TranslationProvider for FailableProvider {
    fn translate(&self, batch: &TranslationBatch) -> Result<ProviderResponse, ProviderError> {
        let call = self.calls.get() + 1;
        self.calls.set(call);
        if self.fail_on_call == Some(call) {
            return Err(ProviderError::Permanent("injected failure".into()));
        }
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

#[test]
fn webvtt_resume_uses_committed_blocks_and_regenerates_verified_copy() -> Result<(), Box<dyn Error>>
{
    let directory = test_directory()?;
    let database = directory.join("auralis-translate.sqlite");
    let mut translation = translation_spec()?;
    translation.source_hash = auralis_translation::SourceHash::digest(SOURCE);
    translation.source_format = "vtt".into();
    let mut run = run_spec()?;
    run.source_hash = translation.source_hash;
    let plan = VttRunPlan::new(
        SOURCE,
        translation.translation_id,
        run.run_id,
        LanguagePair::new(LanguageCode::Chinese, LanguageCode::Russian)?,
        VttBlockPolicy::new(1).ok_or("invalid block policy")?,
    )?;
    run.blocks = plan.blocks().to_vec();
    run.parser_version = VttRunPlan::PARSER_VERSION;
    run.policy_fingerprint =
        VttRunPlan::policy_fingerprint(VttBlockPolicy::new(1).ok_or("invalid block policy")?)
            .to_string();
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
    assert_eq!(segments[1].cue_label, None);
    let mut db = TranslateDb::open(&database, SqliteConfig::default())?;
    db.ensure_translation(&translation)?;
    db.ensure_segments(
        translation.translation_id,
        u64::try_from(plan.source_len())?,
        &segments,
    )?;
    let attempt = db.begin_attempt(&run, None)?;
    let provider = FailableProvider {
        calls: Cell::new(0),
        fail_on_call: Some(2),
    };
    assert!(
        plan.execute_with_policy(
            &provider,
            &mut db,
            &mut NoProgress,
            &NeverPause,
            RetryPolicy::default(),
        )
        .is_err()
    );
    assert_eq!(db.checkpoints(run.run_id)?.len(), 1);
    let result = ResultSpec {
        result_id: ResultId::parse("33333333-3333-4333-8333-333333333333")?,
        run_id: run.run_id,
        revision: 1,
        source_hash: plan.source_hash(),
        block_fingerprints: plan.block_fingerprints(),
        review_state: ReviewState::NeedsReview,
    };
    assert!(matches!(
        db.commit_result(&result, &plan),
        Err(DbError::Conflict(_))
    ));
    db.stop_attempt(run.run_id, attempt, RunStop::Failed, "model failed")?;
    drop(db);

    let mut db = TranslateDb::open(&database, SqliteConfig::default())?;
    assert_eq!(db.segments(translation.translation_id)?, segments);
    db.begin_attempt(&run, None)?;
    let provider = FailableProvider {
        calls: Cell::new(0),
        fail_on_call: None,
    };
    let output = plan.execute_with_policy(
        &provider,
        &mut db,
        &mut NoProgress,
        &NeverPause,
        RetryPolicy::default(),
    )?;
    assert_eq!(provider.calls.get(), 1);
    assert!(String::from_utf8(output.clone())?.contains("Русский 2."));
    assert_ne!(output, SOURCE);
    let committed = db.commit_result(&result, &plan)?;
    assert_eq!(
        committed.output_hash,
        auralis_translation::SourceHash::digest(&output)
    );
    drop(db);
    let db = TranslateDb::open(&database, SqliteConfig::default())?;
    let restored = db.result(result.result_id)?;
    assert_eq!(plan.render_selected(&restored.selected)?, output);
    assert_eq!(
        auralis_translation::SourceHash::digest(SOURCE),
        translation.source_hash
    );
    drop(db);
    std::fs::remove_dir_all(directory)?;
    Ok(())
}
