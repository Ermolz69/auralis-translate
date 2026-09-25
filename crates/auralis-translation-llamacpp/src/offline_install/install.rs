use super::copy_asset::{copy_asset, write_bytes};
use super::extract_archive::extract_archive;
use super::{InstalledRelease, OfflineInstallError};
use crate::ReleaseManifest;
use std::collections::HashSet;
use std::path::Path;

const EXECUTABLE_NAME: &str = "llama-server.exe";

pub fn install_offline(
    manifest_bytes: &[u8],
    profile_bytes: &[u8],
    backend: &str,
    source_dir: &Path,
    destination_root: &Path,
) -> Result<InstalledRelease, OfflineInstallError> {
    if !source_dir.is_absolute() || !destination_root.is_absolute() {
        return Err(OfflineInstallError::Invalid(
            "source and destination directories must be absolute",
        ));
    }
    let manifest = ReleaseManifest::from_json(manifest_bytes, profile_bytes)?;
    let variant = manifest
        .variants()
        .iter()
        .find(|variant| variant.backend == backend)
        .ok_or(OfflineInstallError::Invalid(
            "requested runtime backend is unavailable",
        ))?;
    let release_root = destination_root.join(&manifest.id);
    std::fs::create_dir_all(&release_root)?;
    let final_root = release_root.join(backend);
    if final_root.exists() {
        return Err(OfflineInstallError::Invalid(
            "release backend already exists",
        ));
    }
    let staged = tempfile::Builder::new()
        .prefix(".installing-")
        .tempdir_in(&release_root)?;
    let staged_assets = staged.path().join("assets");
    let staged_runtime = staged.path().join("runtime");
    let staged_model = staged.path().join("model");
    let staged_notices = staged.path().join("notices");
    for directory in [
        &staged_assets,
        &staged_runtime,
        &staged_model,
        &staged_notices,
    ] {
        std::fs::create_dir(directory)?;
    }
    copy_asset(source_dir, &staged_model, manifest.model_asset())?;
    copy_asset(source_dir, &staged_notices, manifest.model_notice())?;
    copy_asset(source_dir, &staged_notices, manifest.runtime_notice())?;

    let mut extracted = HashSet::new();
    for archive in std::iter::once(&variant.archive).chain(&variant.companions) {
        let archived_copy = copy_asset(source_dir, &staged_assets, archive)?;
        extract_archive(&archived_copy, &staged_runtime, &mut extracted)?;
    }
    if !staged_runtime.join(EXECUTABLE_NAME).is_file() {
        return Err(OfflineInstallError::Invalid(
            "runtime archive does not contain llama-server.exe",
        ));
    }
    write_bytes(&staged.path().join("release.json"), manifest_bytes)?;
    write_bytes(&staged.path().join("profile.json"), profile_bytes)?;
    std::fs::rename(staged.path(), &final_root)?;
    Ok(InstalledRelease {
        executable: final_root.join("runtime").join(EXECUTABLE_NAME),
        model_file: final_root
            .join("model")
            .join(&manifest.model_asset().filename),
        profile_file: final_root.join("profile.json"),
        root: final_root,
    })
}
