mod compare_command;

use std::{env, path::Path, process::ExitCode};

use auralis_translation_eval::verify_flores;

fn main() -> ExitCode {
    let args = env::args_os().skip(1).collect::<Vec<_>>();
    let result = match args.as_slice() {
        [command, manifest, archive, root] if command == "verify-flores" => {
            verify_flores(Path::new(manifest), Path::new(archive), Path::new(root))
                .map_err(|error| error.to_string())
                .and_then(|report| serde_json::to_string_pretty(&report).map_err(|error| error.to_string()))
        }
        [command, manifest, archive, root, split, language, row_ids, profile, server, output]
            if command == "compare-flores" =>
        {
            compare_command::run([manifest, archive, root, split, language, row_ids, profile, server, output])
            .map_err(|error| error.to_string())
        }
        _ => Err("usage: auralis-translation-eval verify-flores MANIFEST ARCHIVE CORPUS_ROOT | compare-flores MANIFEST ARCHIVE CORPUS_ROOT SPLIT LANGUAGE ROW_IDS PROFILE SERVER_URL OUTPUT_JSON".into()),
    };
    match result {
        Ok(json) => {
            println!("{json}");
            ExitCode::SUCCESS
        }
        Err(error) => {
            eprintln!("{error}");
            ExitCode::FAILURE
        }
    }
}
