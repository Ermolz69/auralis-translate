use auralis_translation_llamacpp::ReleaseAsset;
use serde::Serialize;
use std::{
    io,
    path::{Path, PathBuf},
};

#[derive(Serialize)]
pub(crate) struct CachedAsset {
    filename: String,
    path: PathBuf,
    sha256: String,
    bytes: u64,
    verified_assets: usize,
    total_assets: usize,
}

impl CachedAsset {
    pub fn new(
        asset: &ReleaseAsset,
        path: &Path,
        verified_assets: usize,
        total_assets: usize,
    ) -> io::Result<Self> {
        Ok(Self {
            filename: asset.filename.clone(),
            path: path.to_owned(),
            sha256: asset.sha256.clone(),
            bytes: asset.bytes.ok_or_else(|| {
                io::Error::new(io::ErrorKind::InvalidData, "validated asset has no length")
            })?,
            verified_assets,
            total_assets,
        })
    }
}
