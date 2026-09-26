use auralis_translation_llamacpp::InstalledRelease;
use serde::Serialize;
use std::path::PathBuf;

#[derive(Serialize)]
pub(crate) struct InstalledPackage {
    root: PathBuf,
    executable: PathBuf,
    model_file: PathBuf,
    profile_file: PathBuf,
}

impl From<InstalledRelease> for InstalledPackage {
    fn from(installed: InstalledRelease) -> Self {
        Self {
            root: installed.root,
            executable: installed.executable,
            model_file: installed.model_file,
            profile_file: installed.profile_file,
        }
    }
}
