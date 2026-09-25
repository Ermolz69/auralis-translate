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
) -> Result<(), Box<dyn Error>> {
    let manifest = std::fs::read(manifest_path)?;
    let profile = std::fs::read(profile_path)?;
    let backend = backend.to_str().ok_or("runtime backend must be Unicode")?;
    let installed = install_offline(
        &manifest,
        &profile,
        backend,
        Path::new(source_dir),
        Path::new(install_root),
    )?;
    println!("installed_root={}", installed.root.display());
    println!("installed_executable={}", installed.executable.display());
    println!("installed_model={}", installed.model_file.display());
    println!("installed_profile={}", installed.profile_file.display());
    Ok(())
}
