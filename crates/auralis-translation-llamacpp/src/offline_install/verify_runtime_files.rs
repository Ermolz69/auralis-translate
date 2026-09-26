use super::OfflineInstallError;
use super::archive_entry::{MAX_ENTRY_BYTES, MAX_FILES, validate_entry};
use crate::{RuntimeVariant, hash_file};
use sha2::{Digest, Sha256};
use std::collections::HashSet;
use std::fs::File;
use std::io::Read;
use std::path::Path;
use zip::ZipArchive;

const HASH_BUFFER_BYTES: usize = 64 * 1024;

pub fn verify_runtime_files(
    assets_dir: &Path,
    runtime_dir: &Path,
    variant: &RuntimeVariant,
) -> Result<(), OfflineInstallError> {
    if !std::fs::symlink_metadata(runtime_dir)?.file_type().is_dir() {
        return Err(OfflineInstallError::Invalid(
            "runtime path is not a regular directory",
        ));
    }
    let mut names = HashSet::new();
    for asset in std::iter::once(&variant.archive).chain(&variant.companions) {
        let archive_path = assets_dir.join(&asset.filename);
        let (digest, bytes) = hash_file(&archive_path)
            .map_err(|_| OfflineInstallError::Invalid("runtime archive could not be hashed"))?;
        if Some(bytes) != asset.bytes || !digest.to_string().eq_ignore_ascii_case(&asset.sha256) {
            return Err(OfflineInstallError::Invalid(
                "runtime archive differs from its pinned digest",
            ));
        }
        let mut archive = ZipArchive::new(File::open(archive_path)?)?;
        if archive.is_empty() || archive.len() > MAX_FILES {
            return Err(OfflineInstallError::Invalid(
                "runtime archive file count is invalid",
            ));
        }
        let mut total_bytes = 0;
        for index in 0..archive.len() {
            let entry = archive.by_index(index)?;
            let name = validate_entry(&entry, &mut names, &mut total_bytes)?;
            let expected_bytes = entry.size();
            let installed_path = runtime_dir.join(name);
            let metadata = std::fs::symlink_metadata(&installed_path)?;
            if !metadata.file_type().is_file() || metadata.len() != expected_bytes {
                return Err(OfflineInstallError::Invalid(
                    "installed runtime file is missing or has changed length",
                ));
            }
            let mut bounded = entry.take(MAX_ENTRY_BYTES + 1);
            let mut expected_digest = Sha256::new();
            let mut read_bytes = 0;
            let mut buffer = [0; HASH_BUFFER_BYTES];
            loop {
                let length = bounded.read(&mut buffer)?;
                if length == 0 {
                    break;
                }
                read_bytes += length as u64;
                expected_digest.update(&buffer[..length]);
            }
            if read_bytes != expected_bytes || read_bytes > MAX_ENTRY_BYTES {
                return Err(OfflineInstallError::Invalid(
                    "runtime archive entry length differs",
                ));
            }
            let (installed_digest, installed_bytes) = hash_file(&installed_path)
                .map_err(|_| OfflineInstallError::Invalid("runtime file could not be hashed"))?;
            if installed_bytes != expected_bytes
                || installed_digest.to_string() != format!("{:x}", expected_digest.finalize())
            {
                return Err(OfflineInstallError::Invalid(
                    "installed runtime differs from the pinned archive",
                ));
            }
        }
    }
    for entry in std::fs::read_dir(runtime_dir)? {
        let entry = entry?;
        if !entry.file_type()?.is_file()
            || !entry
                .file_name()
                .to_str()
                .is_some_and(|name| names.contains(name))
        {
            return Err(OfflineInstallError::Invalid(
                "installed runtime contains an undeclared file",
            ));
        }
    }
    Ok(())
}
