use super::MachineRequest;
use std::ffi::OsString;
impl MachineRequest {
    pub fn into_args(self) -> Vec<OsString> {
        match self {
            Self::FetchRelease {
                manifest,
                profile,
                backend,
                cache_dir,
            } => vec![
                "fetch-release".into(),
                manifest.into(),
                profile.into(),
                backend.into(),
                cache_dir.into(),
            ],
            Self::FetchAsset {
                manifest,
                profile,
                backend,
                filename,
                cache_dir,
            } => vec![
                "fetch-asset".into(),
                manifest.into(),
                profile.into(),
                backend.into(),
                filename.into(),
                cache_dir.into(),
            ],
            Self::InstallOffline {
                manifest,
                profile,
                backend,
                source_dir,
                install_root,
            } => vec![
                "install-offline".into(),
                manifest.into(),
                profile.into(),
                backend.into(),
                source_dir.into(),
                install_root.into(),
            ],
            Self::InstallOnline {
                manifest,
                profile,
                backend,
                cache_dir,
                install_root,
            } => vec![
                "install-online".into(),
                manifest.into(),
                profile.into(),
                backend.into(),
                cache_dir.into(),
                install_root.into(),
            ],
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
