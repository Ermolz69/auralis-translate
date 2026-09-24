mod doctor_command;
mod durable_resume;
mod durable_start;
mod durable_workflow;
mod experimental_command;
mod inspect_command;
mod manual_command;
mod manual_manifest;
mod manual_translation;
mod model_hash;
mod model_preflight;
mod pause_command;
mod read_source;
mod source_snapshot;
mod status_command;
mod stderr_progress;
mod write_new;

use std::process::ExitCode;

fn main() -> ExitCode {
    let args = std::env::args_os().skip(1).collect::<Vec<_>>();
    let result = match args.as_slice() {
        [command, path] if command == "inspect" => inspect_command::run(path),
        [command, source, manifest] if command == "template" => {
            manual_command::template(source, manifest)
        }
        [command, source, manifest, output] if command == "render" => {
            manual_command::render(source, manifest, output)
        }
        [command, state_dir, run_id] if command == "status" => {
            status_command::run(state_dir, run_id)
        }
        [command, state_dir, run_id] if command == "pause" => {
            pause_command::run(state_dir, run_id)
        }
        [command, profile, model] if command == "doctor" => {
            doctor_command::run(profile, model)
        }
        [command, source, profile, endpoint, output] if command == "translate-experimental" => {
            experimental_command::run(source, profile, endpoint, output)
        }
        [command, source, state_dir, profile, endpoint, output] if command == "translate" => {
            durable_start::run(source, state_dir, profile, endpoint, output)
        }
        [command, state_dir, run_id, profile, endpoint, output] if command == "resume" => {
            durable_resume::run(state_dir, run_id, profile, endpoint, output)
        }
        _ => Err("usage: auralis-translation-cli <inspect SOURCE | template SOURCE MANIFEST | render SOURCE MANIFEST OUTPUT | status STATE_DIR RUN_ID | pause STATE_DIR RUN_ID | doctor PROFILE MODEL_FILE | translate-experimental SOURCE PROFILE SERVER_URL OUTPUT | translate SOURCE STATE_DIR PROFILE SERVER_URL OUTPUT | resume STATE_DIR RUN_ID PROFILE SERVER_URL OUTPUT>".into()),
    };

    match result {
        Ok(()) => ExitCode::SUCCESS,
        Err(error) => {
            eprintln!("{error}");
            ExitCode::FAILURE
        }
    }
}
