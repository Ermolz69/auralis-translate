use super::AssetDownloadError;
use super::content_range::verify_partial_range;
use crate::ReleaseAsset;
use crate::hash_file;
use reqwest::StatusCode;
use reqwest::blocking::Client;
use reqwest::header::{ACCEPT_ENCODING, CONTENT_ENCODING, CONTENT_RANGE, RANGE};
use std::fs::{File, OpenOptions, TryLockError};
use std::io::{Read, Seek, SeekFrom, Write};
use std::path::{Path, PathBuf};

const COPY_BUFFER_BYTES: usize = 1024 * 1024;

pub fn download_asset_with_client(
    asset: &ReleaseAsset,
    cache_dir: &Path,
    client: &Client,
) -> Result<PathBuf, AssetDownloadError> {
    asset.validate_file_identity()?;
    if !cache_dir.is_absolute() {
        return Err(AssetDownloadError::Invalid(
            "asset cache path must be absolute",
        ));
    }
    std::fs::create_dir_all(cache_dir)?;
    let final_path = cache_dir.join(&asset.filename);
    let lock_path = cache_dir.join(format!("{}.download.lock", asset.filename));
    reject_non_file(&lock_path)?;
    let lock = OpenOptions::new()
        .read(true)
        .write(true)
        .create(true)
        .truncate(false)
        .open(&lock_path)?;
    match lock.try_lock() {
        Ok(()) => {}
        Err(TryLockError::WouldBlock) => {
            return Err(AssetDownloadError::Busy);
        }
        Err(TryLockError::Error(error)) => return Err(error.into()),
    }
    reject_non_file(&final_path)?;
    if final_path.exists() {
        verify_file(&final_path, asset)?;
        return Ok(final_path);
    }

    let partial_path = cache_dir.join(format!("{}.part.{}", asset.filename, asset.sha256));
    reject_non_file(&partial_path)?;
    let mut partial = OpenOptions::new()
        .read(true)
        .write(true)
        .create(true)
        .truncate(false)
        .open(&partial_path)?;
    let expected = asset
        .bytes
        .ok_or(AssetDownloadError::Invalid("asset length is missing"))?;
    let mut offset = partial.metadata()?.len();
    if offset > expected || (offset == expected && verify_file(&partial_path, asset).is_err()) {
        partial.set_len(0)?;
        offset = 0;
    }
    if offset < expected {
        transfer(asset, client, &mut partial, offset, expected)?;
        partial.sync_all()?;
    }
    drop(partial);
    verify_file(&partial_path, asset)?;
    std::fs::hard_link(&partial_path, &final_path)?;
    std::fs::remove_file(partial_path)?;
    Ok(final_path)
}

fn transfer(
    asset: &ReleaseAsset,
    client: &Client,
    partial: &mut File,
    offset: u64,
    expected: u64,
) -> Result<(), AssetDownloadError> {
    let mut request = client.get(&asset.url).header(ACCEPT_ENCODING, "identity");
    if offset > 0 {
        request = request.header(RANGE, format!("bytes={offset}-"));
    }
    let mut response = request.send()?;
    if response
        .headers()
        .get(CONTENT_ENCODING)
        .is_some_and(|encoding| encoding != "identity")
    {
        return Err(AssetDownloadError::Invalid(
            "compressed asset response is unsupported",
        ));
    }
    let start = match response.status() {
        StatusCode::PARTIAL_CONTENT => {
            verify_partial_range(&response, offset, expected)?;
            offset
        }
        StatusCode::OK => {
            if response.headers().contains_key(CONTENT_RANGE) {
                return Err(AssetDownloadError::Invalid(
                    "full response unexpectedly has Content-Range",
                ));
            }
            if response
                .content_length()
                .is_some_and(|length| length != expected)
            {
                return Err(AssetDownloadError::Invalid(
                    "full response length differs from pinned asset length",
                ));
            }
            partial.set_len(0)?;
            0
        }
        _ => {
            return Err(AssetDownloadError::Invalid(
                "asset server returned HTTP error",
            ));
        }
    };
    partial.seek(SeekFrom::Start(start))?;
    let mut total = start;
    let mut buffer = vec![0_u8; COPY_BUFFER_BYTES];
    loop {
        let count = response.read(&mut buffer)?;
        if count == 0 {
            break;
        }
        total = total
            .checked_add(count as u64)
            .ok_or(AssetDownloadError::Invalid("asset length overflow"))?;
        if total > expected {
            return Err(AssetDownloadError::Invalid(
                "asset response exceeds pinned length",
            ));
        }
        partial.write_all(&buffer[..count])?;
    }
    if total != expected {
        return Err(AssetDownloadError::Invalid(
            "asset response ended before pinned length",
        ));
    }
    Ok(())
}

fn verify_file(path: &Path, asset: &ReleaseAsset) -> Result<(), AssetDownloadError> {
    let (digest, bytes) = hash_file(path)
        .map_err(|_| AssetDownloadError::Invalid("asset file could not be hashed"))?;
    if Some(bytes) != asset.bytes || !digest.to_string().eq_ignore_ascii_case(&asset.sha256) {
        return Err(AssetDownloadError::Invalid(
            "asset differs from pinned length or digest",
        ));
    }
    Ok(())
}

fn reject_non_file(path: &Path) -> Result<(), AssetDownloadError> {
    match std::fs::symlink_metadata(path) {
        Ok(metadata) if metadata.file_type().is_file() => Ok(()),
        Ok(_) => Err(AssetDownloadError::Invalid(
            "asset cache contains a non-regular file",
        )),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(()),
        Err(error) => Err(error.into()),
    }
}
