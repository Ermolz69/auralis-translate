use super::support::{run_spec, test_directory, translation_spec};
use auralis_translation::{
    LanguageCode, LanguagePair, ProviderError, ProviderResponse, ResultId, ReviewState, RunId,
    SegmentId, SourceHash, TargetSegment, TranslationBatch, TranslationProvider,
};
use auralis_translation_formats::srt::{SrtBlockPolicy, SrtRunPlan};
use auralis_translation_sqlite::{
    BranchEditSpec, EditSpec, ResultRecord, ResultSpec, RunSpec, SegmentSpec, SqliteConfig,
    TranslateDb, TranslationSpec,
};
use std::{error::Error, path::PathBuf};

pub const SOURCE: &[u8] =
    "1\n00:00:01,000 --> 00:00:02,000\n你好。\n\n2\n00:00:02,000 --> 00:00:03,000\n再见。\n"
        .as_bytes();

pub struct EditFixture {
    pub db: TranslateDb,
    pub plan: SrtRunPlan,
    pub first: ResultRecord,
    pub run: RunSpec,
    pub translation: TranslationSpec,
    pub path: PathBuf,
    directory: PathBuf,
}

impl EditFixture {
    pub fn new() -> Result<Self, Box<dyn Error>> {
        let directory = test_directory()?;
        let path = directory.join("auralis-translate.sqlite");
        let mut translation = translation_spec()?;
        translation.source_hash = SourceHash::digest(SOURCE);
        let mut run = run_spec()?;
        run.source_hash = translation.source_hash;
        let policy = SrtBlockPolicy::new(1).ok_or("invalid test policy")?;
        let plan = SrtRunPlan::new(
            SOURCE,
            translation.translation_id,
            run.run_id,
            LanguagePair::new(LanguageCode::Chinese, LanguageCode::Russian)?,
            policy,
        )?;
        run.blocks = plan.blocks().to_vec();
        let segments = plan
            .source_segments()
            .iter()
            .enumerate()
            .map(|(index, segment)| {
                Ok(SegmentSpec {
                    id: segment.id,
                    ordinal: u32::try_from(index)?,
                    cue_label: Some(segment.cue_label.clone()),
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
            .collect::<Result<Vec<_>, Box<dyn Error>>>()?;
        let mut db = TranslateDb::open(&path, SqliteConfig::default())?;
        db.ensure_translation(&translation)?;
        db.ensure_segments(
            translation.translation_id,
            u64::try_from(plan.source_len())?,
            &segments,
        )?;
        db.begin_attempt(&run, None)?;
        plan.execute(&StableProvider, &mut db)?;
        let first = db.commit_result(
            &ResultSpec {
                result_id: result_id(1)?,
                run_id: run.run_id,
                revision: 1,
                source_hash: plan.source_hash(),
                block_fingerprints: plan.block_fingerprints(),
                review_state: ReviewState::NeedsReview,
            },
            &plan,
        )?;
        Ok(Self {
            db,
            plan,
            first,
            run,
            translation,
            path,
            directory,
        })
    }

    pub fn add_validated_run(&mut self) -> Result<ResultRecord, Box<dyn Error>> {
        let mut run = run_spec()?;
        run.source_hash = self.run.source_hash;
        run.run_id = RunId::parse("44444444-4444-4444-8444-444444444444")?;
        let plan = SrtRunPlan::new(
            SOURCE,
            self.translation.translation_id,
            run.run_id,
            self.translation.language_pair,
            SrtBlockPolicy::new(1).ok_or("invalid test policy")?,
        )?;
        run.blocks = plan.blocks().to_vec();
        self.db.begin_attempt(&run, None)?;
        plan.execute(&StableProvider, &mut self.db)?;
        Ok(self.db.commit_result(
            &ResultSpec {
                result_id: result_id(100)?,
                run_id: run.run_id,
                revision: 1,
                source_hash: plan.source_hash(),
                block_fingerprints: plan.block_fingerprints(),
                review_state: ReviewState::NeedsReview,
            },
            &plan,
        )?)
    }

    pub fn branch(
        &self,
        base: ResultId,
        head: ResultId,
        new_id: u32,
        segment: u32,
        text: &str,
    ) -> Result<BranchEditSpec, Box<dyn Error>> {
        Ok(BranchEditSpec {
            edit: edit(base, new_id, segment, text)?,
            expected_head_result_id: head,
        })
    }

    pub fn finish(self) -> Result<(), Box<dyn Error>> {
        drop(self.db);
        std::fs::remove_dir_all(self.directory)?;
        Ok(())
    }
}

pub fn result_id(index: u32) -> Result<ResultId, Box<dyn Error>> {
    Ok(ResultId::parse(&format!(
        "33333333-3333-4333-8333-{index:012}"
    ))?)
}

pub fn edit(
    base: ResultId,
    new_id: u32,
    segment: u32,
    text: &str,
) -> Result<EditSpec, Box<dyn Error>> {
    Ok(EditSpec {
        base_result_id: base,
        result_id: result_id(new_id)?,
        segment_id: SegmentId::new(segment).ok_or("invalid test segment")?,
        lines: vec![text.into()],
    })
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
