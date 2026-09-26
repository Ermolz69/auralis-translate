use crate::durable_workflow::DATABASE_FILE;
use auralis_translation::{ReviewState, RunId, RunState};
use auralis_translation_sqlite::{SqliteConfig, TranslateDb};
use serde::Serialize;
use std::error::Error;
use std::ffi::OsStr;
use std::path::Path;

const STATUS_SCHEMA_VERSION: u32 = 3;

#[derive(Serialize)]
struct StatusReport {
    schema_version: u32,
    translation_id: String,
    run_id: String,
    source_sha256: String,
    state: &'static str,
    pause_requested: bool,
    completed_blocks: usize,
    total_blocks: usize,
    warning_count: usize,
    selected_result_id: Option<String>,
    review_state: Option<&'static str>,
}

pub(crate) fn run(
    state_dir: &OsStr,
    run_id: &OsStr,
    reporter: &mut crate::reporting::CommandOutput,
) -> Result<(), Box<dyn Error>> {
    let run_id = RunId::parse(run_id.to_str().ok_or("run ID must be Unicode")?)?;
    let db_path = Path::new(state_dir).join(DATABASE_FILE);
    if !db_path.is_file() {
        return Err(std::io::Error::new(
            std::io::ErrorKind::NotFound,
            "Translate database does not exist in state directory",
        )
        .into());
    }
    let db = TranslateDb::open(&db_path, SqliteConfig::default())?;
    let stored_run = db.run(run_id)?;
    let state = db.run_state(run_id)?;
    let completed_blocks = db.checkpoints(run_id)?.len();
    let result = if state == RunState::Validated {
        Some(db.result_for_run(run_id)?)
    } else {
        None
    };
    let report = StatusReport {
        schema_version: STATUS_SCHEMA_VERSION,
        translation_id: stored_run.translation_id.to_string(),
        run_id: run_id.to_string(),
        source_sha256: stored_run.source_hash.to_string(),
        state: state_name(state),
        pause_requested: db.pause_requested(run_id)?,
        completed_blocks,
        total_blocks: stored_run.blocks.len(),
        warning_count: db.diagnostics(run_id)?.len(),
        selected_result_id: result.as_ref().map(|record| record.result_id.to_string()),
        review_state: result
            .as_ref()
            .map(|record| review_name(record.review_state)),
    };
    reporter.report("status", &report)
}

fn state_name(state: RunState) -> &'static str {
    match state {
        RunState::Requested => "requested",
        RunState::Running => "running",
        RunState::Paused => "paused",
        RunState::Failed => "failed",
        RunState::Validated => "validated",
    }
}

fn review_name(state: ReviewState) -> &'static str {
    match state {
        ReviewState::Ready => "ready",
        ReviewState::NeedsReview => "needs_review",
    }
}
