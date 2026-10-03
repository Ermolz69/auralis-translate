use crate::document_run_error::DocumentRunError;
use crate::document_run_plan::DocumentRunPlan;
use crate::report_result::report_result;
use crate::reporting::{CliEvent, CliFailure, CommandOutput, ErrorCode};
use crate::write_new::write_new;
use auralis_translation::{
    BlockPolicy, ProviderError, ResultId, RetryPolicy, ReviewState, RunState, SourceHash,
    VerifiedRenderer,
};
use auralis_translation_llamacpp::{
    LlamaCppProvider, ModelProfile, RequestControlPolicy, verify_server_with_control,
};
use auralis_translation_sqlite::{
    ModelPreflightOutcome, ResultSpec, RunSpec, RunStop, SqliteConfig, SqliteInferenceRequestSink,
    TranslateDb,
};
use std::error::Error;
use std::ffi::OsStr;
use std::path::Path;
use std::sync::Arc;
use std::time::Instant;
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

pub(crate) fn block_policy(
    profile: &ModelProfile,
    has_scene_map: bool,
) -> Result<BlockPolicy, Box<dyn Error>> {
    if matches!(profile.prompt_version, 5..=8)
        && (profile.context_before_segments != 0 || profile.context_after_segments != 0)
        && !has_scene_map
    {
        return Err("contextual file profile requires an explicit scene map".into());
    }
    BlockPolicy::with_context(
        profile.target_segments_per_block,
        profile.context_before_segments,
        profile.context_after_segments,
    )
    .ok_or_else(|| "model profile has an unsupported block policy".into())
}

pub(crate) fn execute(
    db: &mut TranslateDb,
    run: &RunSpec,
    plan: &DocumentRunPlan,
    profile: ModelProfile,
    config: ExecutionConfig<'_>,
    reporter: &mut CommandOutput,
) -> Result<(), Box<dyn Error>> {
    if config.output_path.exists() {
        return Err(CliFailure::boxed(
            ErrorCode::Conflict,
            "output already exists",
        ));
    }
    let guard = db.capture_attempt_start(run.run_id)?;
    if config.initial_attempt && guard.state() != RunState::Requested {
        return Err(Box::new(
            auralis_translation_sqlite::DbError::PauseRequested,
        ));
    }
    let endpoint = config
        .endpoint
        .to_str()
        .ok_or("server URL must be Unicode")?;
    let retry = RetryPolicy::new(profile.max_block_attempts)
        .ok_or("model profile has an invalid block attempt limit")?;
    let provider = LlamaCppProvider::new(endpoint, profile.clone())?;
    let preflight_id = db.begin_model_preflight(guard)?;
    let preflight_started = Instant::now();
    let preparation = auralis_translation_sqlite::AttemptStartControl::new(
        db,
        guard,
        RequestControlPolicy::default().poll_interval(),
    )?;
    let check = || {
        preparation
            .check()
            .map_err(|cause| auralis_translation::ProviderError::Permanent(cause.to_string()))
    };
    let verification = verify_server_with_control(&provider, &profile, &check);
    if let Err(error) = db.check_attempt_start(guard) {
        let outcome = if matches!(error, auralis_translation_sqlite::DbError::PauseRequested) {
            ModelPreflightOutcome::Paused
        } else {
            ModelPreflightOutcome::Stale
        };
        db.finish_model_preflight(
            run.run_id,
            preflight_id,
            outcome,
            &serde_json::json!({"elapsed_ms": preflight_started.elapsed().as_millis(), "reason": error.to_string()}),
        )?;
        return Err(Box::new(error));
    }
    if let Err(error) = &verification {
        let category = match error {
            ProviderError::Permanent(_) => "permanent",
            ProviderError::Transient(_) => "transient",
            ProviderError::Storage(_) => "storage",
            ProviderError::NameProposalReviewRequired(_) => "name_proposal_review_required",
        };
        db.finish_model_preflight(
            run.run_id,
            preflight_id,
            ModelPreflightOutcome::Failed,
            &serde_json::json!({"elapsed_ms": preflight_started.elapsed().as_millis(), "category": category, "reason": error.to_string()}),
        )?;
    } else {
        let report = verification.as_ref().ok().and_then(Option::as_ref);
        db.finish_model_preflight(
            run.run_id,
            preflight_id,
            if report.is_some() {
                ModelPreflightOutcome::Verified
            } else {
                ModelPreflightOutcome::NotRequired
            },
            &serde_json::json!({
                "elapsed_ms": preflight_started.elapsed().as_millis(),
                "model_alias": report.map(|value| value.model_alias.as_str()),
                "runtime_build": report.map(|value| value.build_info.as_str()),
                "context_tokens": report.map(|value| value.context_tokens),
            }),
        )?;
    }
    if let Some(report) = verification? {
        if reporter.is_machine() {
            reporter.emit(CliEvent::ModelReady {
                alias: report.model_alias.clone(),
                build: report.build_info.clone(),
                context_tokens: u64::from(report.context_tokens),
            })?;
        }
        eprintln!(
            "model_ready alias={} build={} context_tokens={}",
            report.model_alias, report.build_info, report.context_tokens
        );
    }
    let control_db = TranslateDb::open(
        &config.state_dir.join(DATABASE_FILE),
        SqliteConfig::default(),
    )?;
    let attempt = db.begin_guarded_attempt(run, None, guard)?;
    let journal = match SqliteInferenceRequestSink::open(
        &config.state_dir.join(DATABASE_FILE),
        SqliteConfig::default(),
        attempt,
    ) {
        Ok(journal) => journal,
        Err(error) => {
            db.stop_attempt(
                run.run_id,
                attempt,
                RunStop::Failed,
                "inference journal unavailable",
            )?;
            return Err(Box::new(error));
        }
    };
    let provider = provider.with_inference_journal(Arc::new(journal));
    let output = match plan.execute_with_policy(&provider, db, reporter, &control_db, retry) {
        Ok(output) => output,
        Err(DocumentRunError::Paused(error)) => {
            db.stop_attempt(run.run_id, attempt, RunStop::Paused, "pause requested")?;
            return Err(error);
        }
        Err(DocumentRunError::Failed(error)) => {
            db.stop_attempt(run.run_id, attempt, RunStop::Failed, "translation failed")?;
            return Err(error);
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
    report_result(reporter, run, &committed, &output, config.output_path)
}

pub(crate) fn export_validated(
    db: &TranslateDb,
    run: &RunSpec,
    plan: &DocumentRunPlan,
    output_path: &Path,
    reporter: &mut CommandOutput,
) -> Result<(), Box<dyn Error>> {
    if db.run_state(run.run_id)? != RunState::Validated {
        return Err("run is not validated".into());
    }
    let result = db.result_for_run(run.run_id)?;
    if result.source_hash != plan.source_hash() {
        return Err(crate::reporting::CliFailure::boxed(
            crate::reporting::ErrorCode::Conflict,
            "validated result source differs from managed original",
        ));
    }
    let output = plan.render_selected(&result.selected)?;
    if SourceHash::digest(&output) != result.output_hash {
        return Err(crate::reporting::CliFailure::boxed(
            crate::reporting::ErrorCode::Conflict,
            "regenerated output hash differs from validated result",
        ));
    }
    write_new(output_path, &output)?;
    report_result(reporter, run, &result, &output, output_path)
}
