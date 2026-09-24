use auralis_translation::SourceHash;
use auralis_translation_llamacpp::ModelProfile;
use serde::Serialize;
use sha2::{Digest, Sha256};
use std::error::Error;
use std::ffi::OsStr;
use std::fs::File;
use std::io::Read;
use std::path::Path;

const DOCTOR_SCHEMA_VERSION: u32 = 1;
const HASH_BUFFER_BYTES: usize = 64 * 1024;

#[derive(Serialize)]
struct DoctorReport<'a> {
    schema_version: u32,
    model_repo: &'a str,
    model_revision: &'a str,
    model_alias: &'a str,
    model_sha256: String,
    model_bytes: u64,
    verified: bool,
}

pub(crate) fn run(profile_path: &OsStr, model_path: &OsStr) -> Result<(), Box<dyn Error>> {
    let profile = ModelProfile::from_json(&std::fs::read(Path::new(profile_path))?)?;
    let expected = SourceHash::parse_hex(&profile.model_file_sha256)
        .ok_or("profile model SHA-256 is invalid")?;
    let (actual, bytes) = hash_file(Path::new(model_path))?;
    if actual != expected {
        return Err(
            format!("model SHA-256 mismatch: expected {expected}, observed {actual}").into(),
        );
    }
    let report = DoctorReport {
        schema_version: DOCTOR_SCHEMA_VERSION,
        model_repo: &profile.model_repo,
        model_revision: &profile.model_revision,
        model_alias: &profile.model_alias,
        model_sha256: actual.to_string(),
        model_bytes: bytes,
        verified: true,
    };
    println!("{}", serde_json::to_string_pretty(&report)?);
    Ok(())
}

fn hash_file(path: &Path) -> Result<(SourceHash, u64), Box<dyn Error>> {
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
