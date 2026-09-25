use std::{env, path::Path, process::ExitCode};

use auralis_translation_eval::verify_flores;

fn main() -> ExitCode {
    let args = env::args_os().skip(1).collect::<Vec<_>>();
    let [command, manifest, archive, root] = args.as_slice() else {
        eprintln!("usage: auralis-translation-eval verify-flores MANIFEST ARCHIVE CORPUS_ROOT");
        return ExitCode::FAILURE;
    };
    if command != "verify-flores" {
        eprintln!("unknown command");
        return ExitCode::FAILURE;
    }
    match verify_flores(Path::new(manifest), Path::new(archive), Path::new(root)) {
        Ok(report) => match serde_json::to_string_pretty(&report) {
            Ok(json) => {
                println!("{json}");
                ExitCode::SUCCESS
            }
            Err(error) => {
                eprintln!("{error}");
                ExitCode::FAILURE
            }
        },
        Err(error) => {
            eprintln!("{error}");
            ExitCode::FAILURE
        }
    }
}
