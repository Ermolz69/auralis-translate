mod experimental_command;
mod inspect_command;
mod manual_command;
mod manual_manifest;
mod manual_translation;
mod read_source;
mod write_new;

use std::process::ExitCode;

fn main() -> ExitCode {
    let mut args = std::env::args_os().skip(1);
    let result = match (args.next().as_deref(), args.next(), args.next(), args.next(), args.next()) {
        (Some(command), Some(path), None, None, None) if command == "inspect" => inspect_command::run(&path),
        (Some(command), Some(source), Some(manifest), None, None) if command == "template" => {
            manual_command::template(&source, &manifest)
        }
        (Some(command), Some(source), Some(manifest), Some(output), None) if command == "render" => {
            manual_command::render(&source, &manifest, &output)
        }
        (Some(command), Some(source), Some(profile), Some(endpoint), Some(output)) if command == "translate-experimental" => {
            experimental_command::run(&source, &profile, &endpoint, &output)
        }
        _ => Err("usage: auralis-translation-cli <inspect SOURCE | template SOURCE MANIFEST | render SOURCE MANIFEST OUTPUT | translate-experimental SOURCE PROFILE SERVER_URL OUTPUT>".into()),
    };

    match result {
        Ok(()) => ExitCode::SUCCESS,
        Err(error) => {
            eprintln!("{error}");
            ExitCode::FAILURE
        }
    }
}
