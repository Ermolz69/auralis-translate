use crate::{
    package_input::PackageInput,
    reporting::{CachedAsset, CliEvent, CliFailure, CommandOutput, ErrorCode},
};
use auralis_translation_llamacpp::{
    download_release_assets, download_release_assets_with_observer, download_selected_release_asset,
};
use std::error::Error;
use std::ffi::OsStr;
use std::path::Path;

pub(crate) fn run(
    manifest_path: &OsStr,
    profile_path: &OsStr,
    backend: &OsStr,
    cache_dir: &OsStr,
    reporter: &mut CommandOutput,
) -> Result<(), Box<dyn Error>> {
    let input = PackageInput::load(manifest_path, profile_path, backend)?;
    input.report_start(reporter)?;
    fetch(&input, cache_dir, reporter)
}

pub(crate) fn fetch(
    input: &PackageInput,
    cache_dir: &OsStr,
    reporter: &mut CommandOutput,
) -> Result<(), Box<dyn Error>> {
    if reporter.is_machine() {
        let total_assets = input.manifest.assets_for_backend(&input.backend)?.len();
        let mut verified_assets = 0;
        download_release_assets_with_observer(
            &input.manifest_bytes,
            &input.profile_bytes,
            &input.backend,
            Path::new(cache_dir),
            |asset, path| {
                verified_assets += 1;
                reporter.emit(CliEvent::AssetCached {
                    receipt: CachedAsset::new(asset, path, verified_assets, total_assets)?,
                })
            },
        )?;
    } else {
        let assets = download_release_assets(
            &input.manifest_bytes,
            &input.profile_bytes,
            &input.backend,
            Path::new(cache_dir),
        )?;
        for asset in assets {
            println!("cached_asset={}", asset.display());
        }
    }
    Ok(())
}

pub(crate) fn run_one(
    manifest_path: &OsStr,
    profile_path: &OsStr,
    backend: &OsStr,
    filename: &OsStr,
    cache_dir: &OsStr,
    reporter: &mut CommandOutput,
) -> Result<(), Box<dyn Error>> {
    let input = PackageInput::load(manifest_path, profile_path, backend)?;
    let filename = filename.to_str().ok_or_else(|| {
        CliFailure::boxed(ErrorCode::InvalidInput, "asset filename must be Unicode")
    })?;
    let asset = input
        .manifest
        .assets_for_backend(&input.backend)?
        .into_iter()
        .find(|asset| asset.filename == filename)
        .ok_or_else(|| {
            CliFailure::boxed(
                ErrorCode::InvalidInput,
                "asset is not in the selected release backend",
            )
        })?;
    input.report_start(reporter)?;
    let path = download_selected_release_asset(
        &input.manifest_bytes,
        &input.profile_bytes,
        &input.backend,
        filename,
        Path::new(cache_dir),
    )?;
    if reporter.is_machine() {
        reporter.emit(CliEvent::AssetCached {
            receipt: CachedAsset::new(asset, &path, 1, 1)?,
        })?;
    } else {
        println!("cached_asset={}", path.display());
    }
    Ok(())
}
