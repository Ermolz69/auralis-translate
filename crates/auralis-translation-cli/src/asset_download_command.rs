use auralis_translation_llamacpp::{download_release_assets, download_selected_release_asset};
use std::error::Error;
use std::ffi::OsStr;
use std::path::Path;

pub(crate) fn run(
    manifest_path: &OsStr,
    profile_path: &OsStr,
    backend: &OsStr,
    cache_dir: &OsStr,
) -> Result<(), Box<dyn Error>> {
    let manifest = std::fs::read(manifest_path)?;
    let profile = std::fs::read(profile_path)?;
    let backend = backend.to_str().ok_or("runtime backend must be Unicode")?;
    let assets = download_release_assets(&manifest, &profile, backend, Path::new(cache_dir))?;
    for asset in assets {
        println!("cached_asset={}", asset.display());
    }
    Ok(())
}

pub(crate) fn run_one(
    manifest_path: &OsStr,
    profile_path: &OsStr,
    backend: &OsStr,
    filename: &OsStr,
    cache_dir: &OsStr,
) -> Result<(), Box<dyn Error>> {
    let manifest = std::fs::read(manifest_path)?;
    let profile = std::fs::read(profile_path)?;
    let backend = backend.to_str().ok_or("runtime backend must be Unicode")?;
    let filename = filename.to_str().ok_or("asset filename must be Unicode")?;
    let asset = download_selected_release_asset(
        &manifest,
        &profile,
        backend,
        filename,
        Path::new(cache_dir),
    )?;
    println!("cached_asset={}", asset.display());
    Ok(())
}
