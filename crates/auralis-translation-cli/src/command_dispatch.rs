use crate::{
    asset_download_command, diagnostics_command, doctor_command,
    document_run_plan::DocumentRunPlan,
    durable_resume, durable_start, edit_command, experimental_command, inspect_command,
    manual_command, offline_install_command, online_install_command, pause_command,
    reporting::{CliFailure, CommandOutput, ErrorCode},
    start_input::StartInput,
    status_command, vtt_inspect_command, vtt_manual_command,
};
use std::{error::Error, ffi::OsString};
pub(crate) fn dispatch(
    args: &[OsString],
    reporter: &mut CommandOutput,
) -> Result<(), Box<dyn Error>> {
    match args {
        [command, path] if command == "inspect" => inspect_command::run(path, reporter),
        [command, path] if command == "inspect-vtt" => vtt_inspect_command::run(path, reporter),
        [command, source, manifest] if command == "template" => {
            manual_command::template(source, manifest)
        }
        [command, source, manifest] if command == "template-vtt" => {
            vtt_manual_command::template(source, manifest)
        }
        [command, source, manifest, output] if command == "render" => {
            manual_command::render(source, manifest, output)
        }
        [command, source, manifest, output] if command == "render-vtt" => {
            vtt_manual_command::render(source, manifest, output)
        }
        [command, state_dir, run_id] if command == "status" => {
            status_command::run(state_dir, run_id, reporter)
        }
        [command, state_dir, run_id] if command == "diagnostics" => {
            diagnostics_command::run(state_dir, run_id, reporter)
        }
        [command, state_dir, run_id] if command == "pause" => {
            pause_command::run(state_dir, run_id, reporter)
        }
        [command, state_dir, base_result_id, profile, edit, output] if command == "edit" => {
            edit_command::run(state_dir, base_result_id, profile, edit, output, reporter)
        }
        [command, profile, model] if command == "doctor" => {
            doctor_command::run(profile, model, reporter)
        }
        [
            command,
            manifest,
            profile,
            backend,
            source_dir,
            install_root,
        ] if command == "install-offline" => {
            offline_install_command::run(manifest, profile, backend, source_dir, install_root)
        }
        [command, manifest, profile, backend, cache_dir] if command == "fetch-release" => {
            asset_download_command::run(manifest, profile, backend, cache_dir)
        }
        [command, manifest, profile, backend, filename, cache_dir] if command == "fetch-asset" => {
            asset_download_command::run_one(manifest, profile, backend, filename, cache_dir)
        }
        [command, manifest, profile, backend, cache_dir, install_root]
            if command == "install-online" =>
        {
            online_install_command::run(manifest, profile, backend, cache_dir, install_root)
        }
        [command, source, profile, endpoint, output] if command == "translate-experimental" => {
            experimental_command::run(source, profile, endpoint, output)
        }
        [command, source, profile, endpoint, output] if command == "translate-vtt-experimental" => {
            experimental_command::run_vtt(source, profile, endpoint, output)
        }
        [command, source, state_dir, profile, endpoint, output] if command == "translate" => {
            durable_start::run(
                StartInput {
                    source_path: source,
                    state_dir,
                    profile_path: profile,
                    glossary_path: None,
                    endpoint,
                    output_path: output,
                    format: DocumentRunPlan::SRT_FORMAT,
                },
                reporter,
            )
        }
        [command, source, state_dir, profile, endpoint, output] if command == "translate-vtt" => {
            durable_start::run(
                StartInput {
                    source_path: source,
                    state_dir,
                    profile_path: profile,
                    glossary_path: None,
                    endpoint,
                    output_path: output,
                    format: DocumentRunPlan::VTT_FORMAT,
                },
                reporter,
            )
        }
        [
            command,
            source,
            state_dir,
            profile,
            glossary,
            endpoint,
            output,
        ] if command == "translate-glossary" => durable_start::run(
            StartInput {
                source_path: source,
                state_dir,
                profile_path: profile,
                glossary_path: Some(glossary),
                endpoint,
                output_path: output,
                format: DocumentRunPlan::SRT_FORMAT,
            },
            reporter,
        ),
        [command, state_dir, run_id, profile, endpoint, output] if command == "resume" => {
            durable_resume::run(state_dir, run_id, profile, endpoint, output, reporter)
        }
        _ => Err(CliFailure::boxed(
            ErrorCode::Usage,
            "usage: auralis-translation-cli <inspect SOURCE | inspect-vtt SOURCE | template SOURCE MANIFEST | template-vtt SOURCE MANIFEST | render SOURCE MANIFEST OUTPUT | render-vtt SOURCE MANIFEST OUTPUT | status STATE_DIR RUN_ID | diagnostics STATE_DIR RUN_ID | pause STATE_DIR RUN_ID | edit STATE_DIR BASE_RESULT_ID PROFILE EDIT_JSON OUTPUT | doctor PROFILE MODEL_FILE | fetch-release RELEASE_MANIFEST PROFILE BACKEND CACHE_DIR | fetch-asset RELEASE_MANIFEST PROFILE BACKEND FILENAME CACHE_DIR | install-offline RELEASE_MANIFEST PROFILE BACKEND SOURCE_DIR INSTALL_ROOT | install-online RELEASE_MANIFEST PROFILE BACKEND CACHE_DIR INSTALL_ROOT | translate-experimental SOURCE PROFILE SERVER_URL OUTPUT | translate-vtt-experimental SOURCE PROFILE SERVER_URL OUTPUT | translate SOURCE STATE_DIR PROFILE SERVER_URL OUTPUT | translate-vtt SOURCE STATE_DIR PROFILE SERVER_URL OUTPUT | translate-glossary SOURCE STATE_DIR PROFILE GLOSSARY SERVER_URL OUTPUT | resume STATE_DIR RUN_ID PROFILE SERVER_URL OUTPUT>",
        )),
    }
}
