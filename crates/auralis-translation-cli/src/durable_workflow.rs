use crate::stderr_progress::StderrProgress;
use crate::write_new::write_new;
use auralis_translation::{
    ResultId, RetryPolicy, ReviewState, RunState, SourceHash, TranslateRunError,
};
use auralis_translation_formats::srt::{SrtBlockPolicy, SrtRunError, SrtRunPlan};
use auralis_translation_llamacpp::{LlamaCppProvider, ModelProfile};
use auralis_translation_sqlite::{ResultSpec, RunSpec, RunStop, SqliteConfig, TranslateDb};
use std::error::Error;
use std::ffi::OsStr;
use std::path::Path;
use uuid::Uuid;

pub(crate) const DATABASE_FILE: &str = "auralis-translate.sqlite";
pub(crate) const SOURCE_DIRECTORY: &str = "sources";

pub(crate) struct ExecutionConfig<'a> {
    pub endpoint: &'a OsStr,
    pub output_path: &'a Path,
    pub state_dir: &'a Path,
    pub initial_attempt: bool,
}

pub(crate) fn load_profile(path: &Path) -> Result<(ModelProfile, SourceHash), Box<dyn Error>> {
    let bytes = std::fs::read(path)?;
    let profile = ModelProfile::from_json(&bytes)?;
    Ok((profile, SourceHash::digest(&bytes)))
}

pub(crate) fn block_policy(profile: &ModelProfile) -> Result<SrtBlockPolicy, Box<dyn Error>> {
    SrtBlockPolicy::with_context(
        profile.target_segments_per_block,
        profile.context_before_segments,
        profile.context_after_segments,
    )
    .ok_or_else(|| "model profile has an unsupported SRT block policy".into())
}

pub(crate) fn execute(
    db: &mut TranslateDb,
    run: &RunSpec,
    plan: &SrtRunPlan,
    profile: ModelProfile,
    config: ExecutionConfig<'_>,
) -> Result<(), Box<dyn Error>> {
    if config.output_path.exists() {
        return Err("output already exists".into());
    }
    let endpoint = config
        .endpoint
        .to_str()
        .ok_or("server URL must be Unicode")?;
    let retry = RetryPolicy::new(profile.max_block_attempts)
        .ok_or("model profile has an invalid block attempt limit")?;
    let provider = LlamaCppProvider::new(endpoint, profile)?;
    let control_db = TranslateDb::open(
        &config.state_dir.join(DATABASE_FILE),
        SqliteConfig::default(),
    )?;
    let attempt = if config.initial_attempt {
        db.begin_initial_attempt(run, None)?
    } else {
        db.begin_attempt(run, None)?
    };
    let output =
        match plan.execute_with_policy(&provider, db, &mut StderrProgress, &control_db, retry) {
            Ok(output) => output,
            Err(error @ SrtRunError::Translate(TranslateRunError::Paused)) => {
                db.stop_attempt(run.run_id, attempt, RunStop::Paused, "pause requested")?;
                return Err(Box::new(error));
            }
            Err(error) => {
                db.stop_attempt(run.run_id, attempt, RunStop::Failed, "translation failed")?;
                return Err(Box::new(error));
            }
        };
    let result_id = ResultId::new(Uuid::new_v4()).ok_or("failed to create result ID")?;
    let result = ResultSpec {
        result_id,
        run_id: run.run_id,
        revision: 1,
        source_hash: plan.source_hash(),
        block_fingerprints: plan.block_fingerprints(),
        review_state: ReviewState::NeedsReview,
    };
    let committed = match db.commit_result(&result, plan) {
        Ok(committed) => committed,
        Err(error @ auralis_translation_sqlite::DbError::PauseRequested) => {
            db.stop_attempt(run.run_id, attempt, RunStop::Paused, "pause requested")?;
            return Err(Box::new(error));
        }
        Err(error) => {
            db.stop_attempt(
                run.run_id,
                attempt,
                RunStop::Failed,
                "result persistence failed",
            )?;
            return Err(Box::new(error));
        }
    };
    if committed.output_hash != SourceHash::digest(&output) {
        return Err("verified result differs from the completed output".into());
    }
    write_new(config.output_path, &output)?;
    println!("result_id={result_id} review=needs_review");
    Ok(())
}

pub(crate) fn export_validated(
    db: &TranslateDb,
    run: &RunSpec,
    plan: &SrtRunPlan,
    output_path: &Path,
) -> Result<(), Box<dyn Error>> {
    if db.run_state(run.run_id)? != RunState::Validated {
        return Err("run is not validated".into());
    }
    let result = db.result_for_run(run.run_id)?;
    if result.source_hash != plan.source_hash() {
        return Err("validated result source differs from managed original".into());
    }
    let output = plan.render_selected(&result.selected)?;
    if SourceHash::digest(&output) != result.output_hash {
        return Err("regenerated output hash differs from validated result".into());
    }
    write_new(output_path, &output)?;
    let review = match result.review_state {
        ReviewState::Ready => "ready",
        ReviewState::NeedsReview => "needs_review",
    };
    println!("result_id={} review={review}", result.result_id);
    Ok(())
}
