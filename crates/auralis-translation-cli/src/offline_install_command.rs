use crate::{
    package_input::PackageInput,
    reporting::{CliEvent, CommandOutput},
};
use auralis_translation_llamacpp::install_offline;
use std::error::Error;
use std::ffi::OsStr;
use std::path::Path;

pub(crate) fn run(
    manifest_path: &OsStr,
    profile_path: &OsStr,
    backend: &OsStr,
    source_dir: &OsStr,
    install_root: &OsStr,
    reporter: &mut CommandOutput,
) -> Result<(), Box<dyn Error>> {
    let input = PackageInput::load(manifest_path, profile_path, backend)?;
    input.report_start(reporter)?;
    install(&input, source_dir, install_root, reporter)
}

pub(crate) fn install(
    input: &PackageInput,
    source_dir: &OsStr,
    install_root: &OsStr,
    reporter: &mut CommandOutput,
) -> Result<(), Box<dyn Error>> {
    let installed = install_offline(
        &input.manifest_bytes,
        &input.profile_bytes,
        &input.backend,
        Path::new(source_dir),
        Path::new(install_root),
    )?;
    if reporter.is_machine() {
        reporter.emit(CliEvent::PackageInstalled {
            receipt: installed.into(),
        })?;
    } else {
        println!("installed_root={}", installed.root.display());
        println!("installed_executable={}", installed.executable.display());
        println!("installed_model={}", installed.model_file.display());
        println!("installed_profile={}", installed.profile_file.display());
    }
    Ok(())
}
