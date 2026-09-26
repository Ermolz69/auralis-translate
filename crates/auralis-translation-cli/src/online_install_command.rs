use super::{asset_download_command, offline_install_command};
use crate::{package_input::PackageInput, reporting::CommandOutput};
use std::error::Error;
use std::ffi::OsStr;

pub(crate) fn run(
    manifest_path: &OsStr,
    profile_path: &OsStr,
    backend: &OsStr,
    cache_dir: &OsStr,
    install_root: &OsStr,
    reporter: &mut CommandOutput,
) -> Result<(), Box<dyn Error>> {
    let input = PackageInput::load(manifest_path, profile_path, backend)?;
    input.report_start(reporter)?;
    asset_download_command::fetch(&input, cache_dir, reporter)?;
    offline_install_command::install(&input, cache_dir, install_root, reporter)
}
