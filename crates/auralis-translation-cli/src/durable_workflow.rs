use crate::stderr_progress::StderrProgress;
use crate::write_new::write_new;
use auralis_translation::{ResultId, ReviewState, RunState, SourceHash};
use auralis_translation_formats::srt::SrtRunPlan;
use auralis_translation_llamacpp::{LlamaCppProvider, ModelProfile};
use auralis_translation_sqlite::{ResultSpec, RunSpec, RunStop, TranslateDb};
use std::error::Error;
use std::ffi::OsStr;
use std::path::Path;
use uuid::Uuid;

pub(crate) const DATABASE_FILE: &str = "auralis-translate.sqlite";
pub(crate) const SOURCE_DIRECTORY: &str = "sources";

pub(crate) fn load_profile(path: &Path) -> Result<(ModelProfile, SourceHash), Box<dyn Error>> {
    let bytes = std::fs::read(path)?;
    let profile = ModelProfile::from_json(&bytes)?;
    Ok((profile, SourceHash::digest(&bytes)))
}

pub(crate) fn execute(
    db: &mut TranslateDb,
    run: &RunSpec,
    plan: &SrtRunPlan,
    profile: ModelProfile,
    endpoint: &OsStr,
    output_path: &Path,
) -> Result<(), Box<dyn Error>> {
    if output_path.exists() {
        return Err("output already exists".into());
    }
    let endpoint = endpoint.to_str().ok_or("server URL must be Unicode")?;
    let provider = LlamaCppProvider::new(endpoint, profile)?;
    let attempt = db.begin_attempt(run, None)?;
    let output = match plan.execute_with_progress(&provider, db, &mut StderrProgress) {
        Ok(output) => output,
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
    write_new(output_path, &output)?;
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
