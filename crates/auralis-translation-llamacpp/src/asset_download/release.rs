use super::{AssetDownloadError, download_asset_with_client, release_download_client};
use crate::ReleaseManifest;
use std::path::{Path, PathBuf};

pub fn download_release_assets(
    manifest_bytes: &[u8],
    profile_bytes: &[u8],
    backend: &str,
    cache_dir: &Path,
) -> Result<Vec<PathBuf>, AssetDownloadError> {
    download_release_assets_with_observer(
        manifest_bytes,
        profile_bytes,
        backend,
        cache_dir,
        |_, _| Ok(()),
    )
}

pub fn download_release_assets_with_observer(
    manifest_bytes: &[u8],
    profile_bytes: &[u8],
    backend: &str,
    cache_dir: &Path,
    mut verified: impl FnMut(&crate::ReleaseAsset, &Path) -> Result<(), std::io::Error>,
) -> Result<Vec<PathBuf>, AssetDownloadError> {
    let manifest = ReleaseManifest::from_json(manifest_bytes, profile_bytes)?;
    let assets = manifest.assets_for_backend(backend)?;
    let client = release_download_client()?;
    assets
        .into_iter()
        .map(|asset| {
            let path = download_asset_with_client(asset, cache_dir, &client)?;
            verified(asset, &path)?;
            Ok(path)
        })
        .collect()
}

pub fn download_selected_release_asset(
    manifest_bytes: &[u8],
    profile_bytes: &[u8],
    backend: &str,
    filename: &str,
    cache_dir: &Path,
) -> Result<PathBuf, AssetDownloadError> {
    let manifest = ReleaseManifest::from_json(manifest_bytes, profile_bytes)?;
    let asset = manifest
        .assets_for_backend(backend)?
        .into_iter()
        .find(|asset| asset.filename == filename)
        .ok_or(AssetDownloadError::Invalid(
            "asset is not in the selected release backend",
        ))?;
    download_asset_with_client(asset, cache_dir, &release_download_client()?)
}
