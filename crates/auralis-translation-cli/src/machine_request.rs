use serde::Deserialize;
use std::{ffi::OsString, path::PathBuf};

#[derive(Deserialize)]
#[serde(tag = "command", rename_all = "kebab-case", deny_unknown_fields)]
pub(crate) enum MachineRequest {
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

impl MachineRequest {
    pub fn into_args(self) -> Vec<OsString> {
        match self {
            Self::Inspect { source } => vec!["inspect".into(), source.into()],
            Self::InspectVtt { source } => vec!["inspect-vtt".into(), source.into()],
            Self::Doctor { profile, model } => vec!["doctor".into(), profile.into(), model.into()],
            Self::Status { state_dir, run_id } => {
                vec!["status".into(), state_dir.into(), run_id.into()]
            }
            Self::Diagnostics { state_dir, run_id } => {
                vec!["diagnostics".into(), state_dir.into(), run_id.into()]
            }
            Self::Pause { state_dir, run_id } => {
                vec!["pause".into(), state_dir.into(), run_id.into()]
            }
            Self::Translate {
                source,
                state_dir,
                profile,
                endpoint,
                output,
            } => vec![
                "translate".into(),
                source.into(),
                state_dir.into(),
                profile.into(),
                endpoint.into(),
                output.into(),
            ],
            Self::TranslateVtt {
                source,
                state_dir,
                profile,
                endpoint,
                output,
            } => vec![
                "translate-vtt".into(),
                source.into(),
                state_dir.into(),
                profile.into(),
                endpoint.into(),
                output.into(),
            ],
            Self::TranslateGlossary {
                source,
                state_dir,
                profile,
                glossary,
                endpoint,
                output,
            } => vec![
                "translate-glossary".into(),
                source.into(),
                state_dir.into(),
                profile.into(),
                glossary.into(),
                endpoint.into(),
                output.into(),
            ],
            Self::Resume {
                state_dir,
                run_id,
                profile,
                endpoint,
                output,
            } => vec![
                "resume".into(),
                state_dir.into(),
                run_id.into(),
                profile.into(),
                endpoint.into(),
                output.into(),
            ],
            Self::Edit {
                state_dir,
                base_result_id,
                profile,
                edit,
                output,
            } => vec![
                "edit".into(),
                state_dir.into(),
                base_result_id.into(),
                profile.into(),
                edit.into(),
                output.into(),
            ],
        }
    }
}
