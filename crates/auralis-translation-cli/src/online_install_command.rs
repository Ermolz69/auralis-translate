use super::{asset_download_command, offline_install_command};
use std::error::Error;
use std::ffi::OsStr;

pub(crate) fn run(
    manifest_path: &OsStr,
    profile_path: &OsStr,
    backend: &OsStr,
    cache_dir: &OsStr,
    install_root: &OsStr,
) -> Result<(), Box<dyn Error>> {
    asset_download_command::run(manifest_path, profile_path, backend, cache_dir)?;
    offline_install_command::run(
        manifest_path,
        profile_path,
        backend,
        cache_dir,
        install_root,
    )
}
