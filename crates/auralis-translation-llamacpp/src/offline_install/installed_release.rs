use std::path::PathBuf;

#[derive(Clone, Debug)]
pub struct InstalledRelease {
    pub root: PathBuf,
    pub executable: PathBuf,
    pub model_file: PathBuf,
    pub profile_file: PathBuf,
}
