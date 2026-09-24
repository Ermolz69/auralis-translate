mod inspect_command;
mod manual_command;
mod manual_manifest;
mod manual_translation;
mod read_source;
mod write_new;

use std::process::ExitCode;

fn main() -> ExitCode {
    let mut args = std::env::args_os().skip(1);
    let result = match (args.next().as_deref(), args.next(), args.next(), args.next()) {
        (Some(command), Some(path), None, None) if command == "inspect" => inspect_command::run(&path),
        (Some(command), Some(source), Some(manifest), None) if command == "template" => {
            manual_command::template(&source, &manifest)
        }
        (Some(command), Some(source), Some(manifest), Some(output)) if command == "render" => {
            manual_command::render(&source, &manifest, &output)
        }
        _ => Err("usage: auralis-translation-cli <inspect SOURCE | template SOURCE MANIFEST | render SOURCE MANIFEST OUTPUT>".into()),
    };

    match result {
        Ok(()) => ExitCode::SUCCESS,
        Err(error) => {
            eprintln!("{error}");
            ExitCode::FAILURE
        }
    }
}
