use std::path::Path;
use std::time::{Duration, SystemTime};
use uuid::Uuid;

const STALE_AFTER: Duration = Duration::from_secs(24 * 60 * 60);

pub(crate) fn remove_stale_for(output: &Path) {
    let Some(name) = output.file_name().and_then(|name| name.to_str()) else {
        return;
    };
    let directory = output.parent().unwrap_or_else(|| Path::new("."));
    let Ok(entries) = std::fs::read_dir(directory) else {
        return;
    };
    let prefix = format!(".{name}.");
    let now = SystemTime::now();
    for entry in entries.flatten() {
        let Some(candidate) = entry.file_name().to_str().map(str::to_owned) else {
            continue;
        };
        let Some(uuid) = candidate
            .strip_prefix(&prefix)
            .and_then(|value| value.strip_suffix(".tmp"))
            .and_then(|value| {
                Uuid::parse_str(value)
                    .ok()
                    .filter(|id| id.to_string() == value)
            })
        else {
            continue;
        };
        if uuid.get_version_num() != 4 {
            continue;
        }
        let Ok(metadata) = entry.path().symlink_metadata() else {
            continue;
        };
        if !metadata.file_type().is_file() {
            continue;
        }
        let Some(age) = metadata
            .modified()
            .ok()
            .and_then(|modified| now.duration_since(modified).ok())
        else {
            continue;
        };
        if age < STALE_AFTER {
            continue;
        }
        let _ = std::fs::remove_file(entry.path());
    }
}
