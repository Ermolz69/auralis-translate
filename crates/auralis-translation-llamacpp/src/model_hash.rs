use crate::PreparationControl;
use auralis_translation::{ProviderError, SourceHash};
use sha2::{Digest, Sha256};
use std::sync::atomic::{AtomicU64, Ordering};
use std::{fs::File, io::Read, path::Path};

const HASH_BUFFER_BYTES: usize = 64 * 1024;
static NEXT_HASH_OPERATION: AtomicU64 = AtomicU64::new(1);

pub fn hash_file(path: &Path) -> Result<(SourceHash, u64), ProviderError> {
    hash_file_with_control(path, &|| Ok(()))
}

pub fn hash_file_with_control(
    path: &Path,
    control: &dyn PreparationControl,
) -> Result<(SourceHash, u64), ProviderError> {
    let hash_operation = NEXT_HASH_OPERATION.fetch_add(1, Ordering::Relaxed);
    let mut bytes = 0_u64;
    let mut total_bytes = 0_u64;
    let result = (|| {
        control.check()?;
        let mut file = File::open(path).map_err(io_error)?;
        total_bytes = file.metadata().map_err(io_error)?.len();
        let mut hasher = Sha256::new();
        let mut buffer = [0_u8; HASH_BUFFER_BYTES];
        let mut started = false;
        loop {
            control.check()?;
            let count = file.read(&mut buffer).map_err(io_error)?;
            if count == 0 {
                break;
            }
            hasher.update(&buffer[..count]);
            bytes = bytes
                .checked_add(
                    u64::try_from(count)
                        .map_err(|error| ProviderError::Permanent(error.to_string()))?,
                )
                .ok_or_else(|| ProviderError::Permanent("model file is too large".into()))?;
            if !started {
                tracing::info!(
                    event_name = "translation_model_hash_started",
                    hash_operation,
                    hashed_bytes = bytes,
                    total_bytes
                );
                started = true;
            }
        }
        control.check()?;
        Ok((SourceHash::from_bytes(hasher.finalize().into()), bytes))
    })();
    tracing::info!(
        event_name = "translation_model_hash_finished",
        hash_operation,
        hashed_bytes = bytes,
        total_bytes,
        outcome = if result.is_ok() {
            "completed"
        } else {
            "failed"
        }
    );
    result
}

fn io_error(error: std::io::Error) -> ProviderError {
    ProviderError::Permanent(error.to_string())
}
