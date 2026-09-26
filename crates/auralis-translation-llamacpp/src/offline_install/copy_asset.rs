use super::OfflineInstallError;
use crate::ReleaseAsset;
use sha2::{Digest, Sha256};
use std::fs::{File, OpenOptions};
use std::io::{Read, Write};
use std::path::{Path, PathBuf};

const COPY_BUFFER_BYTES: usize = 1024 * 1024;

pub(super) fn copy_asset(
    source_dir: &Path,
    output_dir: &Path,
    asset: &ReleaseAsset,
) -> Result<PathBuf, OfflineInstallError> {
    let source = source_dir.join(&asset.filename);
    if !std::fs::symlink_metadata(&source)?.file_type().is_file() {
        return Err(OfflineInstallError::Invalid(
            "asset source must be a regular file",
        ));
    }
    let destination = output_dir.join(&asset.filename);
    let mut input = File::open(source)?;
    let mut output = OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(&destination)?;
    let mut hasher = Sha256::new();
    let mut size = 0_u64;
    let mut buffer = vec![0_u8; COPY_BUFFER_BYTES];
    loop {
        let read = input.read(&mut buffer)?;
        if read == 0 {
            break;
        }
        size = size
            .checked_add(read as u64)
            .ok_or(OfflineInstallError::Invalid("asset length overflow"))?;
        if asset.bytes.is_some_and(|expected| size > expected) {
            return Err(OfflineInstallError::Integrity {
                filename: asset.filename.clone(),
            });
        }
        hasher.update(&buffer[..read]);
        output.write_all(&buffer[..read])?;
    }
    output.sync_all()?;
    if asset.bytes.is_some_and(|expected| size != expected)
        || !asset
            .sha256
            .eq_ignore_ascii_case(&format!("{:x}", hasher.finalize()))
    {
        return Err(OfflineInstallError::Integrity {
            filename: asset.filename.clone(),
        });
    }
    Ok(destination)
}

pub(super) fn write_bytes(path: &Path, bytes: &[u8]) -> Result<(), OfflineInstallError> {
    let mut file = OpenOptions::new().write(true).create_new(true).open(path)?;
    file.write_all(bytes)?;
    file.sync_all()?;
    Ok(())
}
