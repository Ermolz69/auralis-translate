use serde::Deserialize;
use std::path::PathBuf;

#[derive(Deserialize)]
#[serde(tag = "command", rename_all = "kebab-case", deny_unknown_fields)]
pub(crate) enum MachineRequest {
    FetchRelease {
        manifest: PathBuf,
        profile: PathBuf,
        backend: String,
        cache_dir: PathBuf,
    },
    FetchAsset {
        manifest: PathBuf,
        profile: PathBuf,
        backend: String,
        filename: String,
        cache_dir: PathBuf,
    },
    InstallOffline {
        manifest: PathBuf,
        profile: PathBuf,
        backend: String,
        source_dir: PathBuf,
        install_root: PathBuf,
    },
    InstallOnline {
        manifest: PathBuf,
        profile: PathBuf,
        backend: String,
        cache_dir: PathBuf,
        install_root: PathBuf,
    },
    Inspect {
        source: PathBuf,
    },
    InspectVtt {
        source: PathBuf,
    },
    Doctor {
        profile: PathBuf,
        model: PathBuf,
    },
    Status {
        state_dir: PathBuf,
        run_id: String,
    },
    Diagnostics {
        state_dir: PathBuf,
        run_id: String,
    },
    Pause {
        state_dir: PathBuf,
        run_id: String,
    },
    Translate {
        source: PathBuf,
        state_dir: PathBuf,
        profile: PathBuf,
        endpoint: String,
        output: PathBuf,
    },
    TranslateVtt {
        source: PathBuf,
        state_dir: PathBuf,
        profile: PathBuf,
        endpoint: String,
        output: PathBuf,
    },
    TranslateGlossary {
        source: PathBuf,
        state_dir: PathBuf,
        profile: PathBuf,
        glossary: PathBuf,
        endpoint: String,
        output: PathBuf,
    },
    Resume {
        state_dir: PathBuf,
        run_id: String,
        profile: PathBuf,
        endpoint: String,
        output: PathBuf,
    },
    Edit {
        state_dir: PathBuf,
        base_result_id: String,
        profile: PathBuf,
        edit: PathBuf,
        output: PathBuf,
    },
}
