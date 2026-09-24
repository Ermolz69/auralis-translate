use auralis_translation::{ProviderError, SourceHash};
use sha2::{Digest, Sha256};
use std::{fs::File, io::Read, path::Path};

const HASH_BUFFER_BYTES: usize = 64 * 1024;

pub fn hash_file(path: &Path) -> Result<(SourceHash, u64), ProviderError> {
    let mut file = File::open(path).map_err(io_error)?;
    let mut hasher = Sha256::new();
    let mut bytes = 0_u64;
    let mut buffer = [0_u8; HASH_BUFFER_BYTES];
    loop {
        let count = file.read(&mut buffer).map_err(io_error)?;
        if count == 0 {
            break;
        }
        hasher.update(&buffer[..count]);
        bytes = bytes
            .checked_add(u64::try_from(count).map_err(|error| ProviderError(error.to_string()))?)
            .ok_or_else(|| ProviderError("model file is too large".into()))?;
    }
    Ok((SourceHash::from_bytes(hasher.finalize().into()), bytes))
}

fn io_error(error: std::io::Error) -> ProviderError {
    ProviderError(error.to_string())
}
