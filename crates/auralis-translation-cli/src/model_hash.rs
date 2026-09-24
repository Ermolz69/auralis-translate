use auralis_translation::SourceHash;
use sha2::{Digest, Sha256};
use std::{error::Error, fs::File, io::Read, path::Path};

const HASH_BUFFER_BYTES: usize = 64 * 1024;

pub(crate) fn hash_file(path: &Path) -> Result<(SourceHash, u64), Box<dyn Error>> {
    let mut file = File::open(path)?;
    let mut hasher = Sha256::new();
    let mut bytes = 0_u64;
    let mut buffer = [0_u8; HASH_BUFFER_BYTES];
    loop {
        let count = file.read(&mut buffer)?;
        if count == 0 {
            break;
        }
        hasher.update(&buffer[..count]);
        bytes = bytes
            .checked_add(u64::try_from(count)?)
            .ok_or("model file is too large")?;
    }
    Ok((SourceHash::from_bytes(hasher.finalize().into()), bytes))
}
