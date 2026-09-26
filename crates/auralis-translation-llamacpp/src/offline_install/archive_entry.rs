use super::OfflineInstallError;
use std::collections::HashSet;

pub(super) const MAX_FILES: usize = 256;
pub(super) const MAX_ENTRY_BYTES: u64 = 128 * 1024 * 1024;
const MAX_TOTAL_BYTES: u64 = 512 * 1024 * 1024;

pub(super) fn validate_entry(
    entry: &zip::read::ZipFile<'_, std::fs::File>,
    names: &mut HashSet<String>,
    total_bytes: &mut u64,
) -> Result<String, OfflineInstallError> {
    let name = entry.name();
    if entry.is_dir()
        || name.is_empty()
        || name == "."
        || name == ".."
        || !name
            .bytes()
            .all(|byte| byte.is_ascii_alphanumeric() || matches!(byte, b'.' | b'-' | b'_'))
        || !names.insert(name.to_owned())
        || entry
            .unix_mode()
            .is_some_and(|mode| mode & 0o170000 == 0o120000)
    {
        return Err(OfflineInstallError::Invalid(
            "runtime archive contains an unsafe or duplicate entry",
        ));
    }
    *total_bytes = total_bytes
        .checked_add(entry.size())
        .ok_or(OfflineInstallError::Invalid(
            "runtime archive size overflow",
        ))?;
    if entry.size() > MAX_ENTRY_BYTES || *total_bytes > MAX_TOTAL_BYTES {
        return Err(OfflineInstallError::Invalid(
            "runtime archive exceeds extraction limits",
        ));
    }
    Ok(name.to_owned())
}
