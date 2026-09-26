use auralis_translation::SourceHash;
use auralis_translation_llamacpp::{ModelProfile, hash_file};
use serde::Serialize;
use std::error::Error;
use std::ffi::OsStr;
use std::path::Path;

const DOCTOR_SCHEMA_VERSION: u32 = 1;

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

pub(crate) fn run(
    profile_path: &OsStr,
    model_path: &OsStr,
    reporter: &mut crate::reporting::CommandOutput,
) -> Result<(), Box<dyn Error>> {
    let profile = ModelProfile::from_json(&std::fs::read(Path::new(profile_path))?)?;
    let expected = SourceHash::parse_hex(&profile.model_file_sha256)
        .ok_or("profile model SHA-256 is invalid")?;
    let (actual, bytes) = hash_file(Path::new(model_path))?;
    if actual != expected {
        return Err(crate::reporting::CliFailure::boxed(
            crate::reporting::ErrorCode::ModelMismatch,
            format!("model SHA-256 mismatch: expected {expected}, observed {actual}"),
        ));
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
    reporter.report("doctor", &report)
}
