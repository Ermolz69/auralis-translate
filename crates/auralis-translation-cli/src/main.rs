mod asset_download_command;
mod diagnostics_command;
mod doctor_command;
mod document_render_error;
mod document_run_error;
mod document_run_plan;
mod durable_resume;
mod durable_start;
mod durable_workflow;
mod edit_command;
mod edit_payload;
mod experimental_command;
mod glossary_input;
mod inspect_command;
mod loaded_run;
mod managed_glossary;
mod manual_command;
mod manual_manifest;
mod manual_translation;
mod offline_install_command;
mod online_install_command;
mod pause_command;
mod read_source;
mod source_snapshot;
mod stale_output;
mod status_command;

mod vtt_inspect_command;
mod vtt_manual_command;
mod write_new;

mod machine_request;
mod package_input;
mod report_result;
mod reporting;
mod request_document;
mod start_input;

mod command_dispatch;
use reporting::{CliFailure, CommandOutput, ErrorCode, OutputFormat};

use std::process::ExitCode;

fn main() -> ExitCode {
    let mut args = std::env::args_os().skip(1).collect::<Vec<_>>();
    let format = match args.first().and_then(|arg| arg.to_str()) {
        Some("--json") => OutputFormat::Json,
        Some("--jsonl") => OutputFormat::Jsonl,
        _ => OutputFormat::Legacy,
    };
    if format != OutputFormat::Legacy {
        args.remove(0);
    }
    let mut reporter = CommandOutput::new(
        format,
        args.first()
            .and_then(|arg| arg.to_str())
            .unwrap_or("")
            .into(),
    );
    let result = (|| {
        if args.first().is_some_and(|arg| arg == "--request") {
            if format == OutputFormat::Legacy || args.len() != 2 {
                return Err(CliFailure::boxed(
                    ErrorCode::Usage,
                    "--request requires a machine output flag and one request file",
                ));
            }
            args = request_document::load(std::path::Path::new(&args[1]))?;
            reporter.set_command(args.first().and_then(|arg| arg.to_str()).unwrap_or(""));
        }
        if reporter.is_machine() {
            if args.iter().any(|arg| arg.to_str().is_none()) {
                return Err(CliFailure::boxed(
                    ErrorCode::InvalidInput,
                    "machine arguments must be Unicode",
                ));
            }
            let command = args.first().and_then(|arg| arg.to_str()).unwrap_or("");
            if !matches!(
                command,
                "inspect"
                    | "inspect-vtt"
                    | "doctor"
                    | "status"
                    | "diagnostics"
                    | "pause"
                    | "translate"
                    | "translate-vtt"
                    | "translate-glossary"
                    | "resume"
                    | "edit"
                    | "fetch-release"
                    | "fetch-asset"
                    | "install-offline"
                    | "install-online"
            ) {
                return Err(CliFailure::boxed(
                    ErrorCode::Usage,
                    "command is not available in machine protocol v1",
                ));
            }
        }
        command_dispatch::dispatch(&args, &mut reporter)
    })();
    if let Err(error) = &result {
        eprintln!("{error}");
    }
    if !reporter.is_machine() {
        return if result.is_ok() {
            ExitCode::SUCCESS
        } else {
            ExitCode::FAILURE
        };
    }
    let failure = result
        .err()
        .map(|error| (reporting::classify(error.as_ref()), error.to_string()));
    match reporter.finish(failure) {
        Ok(exit) => ExitCode::from(exit),
        Err(error) => {
            eprintln!("CLI output failed: {error}");
            ExitCode::from(ErrorCode::IoFailure.exit_code())
        }
    }
}
