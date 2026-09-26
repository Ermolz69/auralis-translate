use super::OfflineInstallError;
use super::archive_entry::{MAX_ENTRY_BYTES, MAX_FILES, validate_entry};
use std::collections::HashSet;
use std::fs::{File, OpenOptions};
use std::io::{Read, Write};
use std::path::Path;
use zip::ZipArchive;

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
        let name = validate_entry(&entry, extracted, &mut total_bytes)?;
        let expected_bytes = entry.size();
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
