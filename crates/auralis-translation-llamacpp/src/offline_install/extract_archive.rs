use super::OfflineInstallError;
use std::collections::HashSet;
use std::fs::{File, OpenOptions};
use std::io::{Read, Write};
use std::path::Path;
use zip::ZipArchive;

const MAX_FILES: usize = 256;
const MAX_ENTRY_BYTES: u64 = 128 * 1024 * 1024;
const MAX_TOTAL_BYTES: u64 = 512 * 1024 * 1024;

pub(super) fn extract_archive(
    archive_path: &Path,
    runtime_dir: &Path,
    extracted: &mut HashSet<String>,
) -> Result<(), OfflineInstallError> {
    let mut archive = ZipArchive::new(File::open(archive_path)?)?;
    if archive.is_empty() || archive.len() > MAX_FILES {
        return Err(OfflineInstallError::Invalid(
            "runtime archive file count is invalid",
        ));
    }
    let mut total_bytes = 0_u64;
    for index in 0..archive.len() {
        let entry = archive.by_index(index)?;
        let name = entry.name().to_owned();
        if entry.is_dir()
            || name.is_empty()
            || name == "."
            || name == ".."
            || !name
                .bytes()
                .all(|byte| byte.is_ascii_alphanumeric() || matches!(byte, b'.' | b'-' | b'_'))
            || !extracted.insert(name.clone())
            || entry
                .unix_mode()
                .is_some_and(|mode| mode & 0o170000 == 0o120000)
        {
            return Err(OfflineInstallError::Invalid(
                "runtime archive contains an unsafe or duplicate entry",
            ));
        }
        let expected_bytes = entry.size();
        total_bytes =
            total_bytes
                .checked_add(expected_bytes)
                .ok_or(OfflineInstallError::Invalid(
                    "runtime archive size overflow",
                ))?;
        if expected_bytes > MAX_ENTRY_BYTES || total_bytes > MAX_TOTAL_BYTES {
            return Err(OfflineInstallError::Invalid(
                "runtime archive exceeds extraction limits",
            ));
        }
        let mut output = OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(runtime_dir.join(name))?;
        let copied = std::io::copy(&mut entry.take(MAX_ENTRY_BYTES + 1), &mut output)?;
        if copied > MAX_ENTRY_BYTES || copied != expected_bytes {
            return Err(OfflineInstallError::Invalid(
                "runtime archive entry length differs",
            ));
        }
        output.flush()?;
        output.sync_all()?;
    }
    Ok(())
}
