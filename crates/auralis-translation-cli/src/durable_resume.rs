use crate::durable_workflow::{ExecutionConfig, execute, export_validated};
use crate::loaded_run::{LoadedRun, load};
use crate::reporting::{CliEvent, CommandOutput};
use auralis_translation::{RunId, RunState};
use std::error::Error;
use std::ffi::OsStr;
use std::path::Path;

pub(crate) fn run(
    state_dir: &OsStr,
    run_id: &OsStr,
    profile_path: &OsStr,
    endpoint: &OsStr,
    output_path: &OsStr,
    reporter: &mut CommandOutput,
) -> Result<(), Box<dyn Error>> {
    let run_id = RunId::parse(run_id.to_str().ok_or("run ID must be Unicode")?)?;
    let LoadedRun {
        mut db,
        run,
        plan,
        profile,
        state_dir,
    } = load(state_dir, run_id, profile_path)?;
    let output_path = Path::new(output_path);
    if reporter.is_machine() {
        reporter.emit(CliEvent::RunStarted {
            translation_id: run.translation_id.to_string(),
            run_id: run_id.to_string(),
            source_sha256: plan.source_hash().to_string(),
            format: plan.source_format().into(),
        })?;
    } else {
        println!("translation_id={} run_id={run_id}", run.translation_id);
        std::io::Write::flush(&mut std::io::stdout())?;
    }
    if db.run_state(run_id)? == RunState::Validated {
        return export_validated(&db, &run, &plan, output_path, reporter);
    }
    db.recover_interrupted(run_id)?;
    execute(
        &mut db,
        &run,
        &plan,
        profile,
        ExecutionConfig {
            endpoint,
            output_path,
            state_dir: &state_dir,
            initial_attempt: false,
        },
        reporter,
    )
}
