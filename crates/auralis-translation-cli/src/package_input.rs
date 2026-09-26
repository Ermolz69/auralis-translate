use crate::reporting::{CliEvent, CliFailure, CommandOutput, ErrorCode};
use auralis_translation::SourceHash;
use auralis_translation_llamacpp::ReleaseManifest;
use std::{error::Error, ffi::OsStr};

pub(crate) struct PackageInput {
    pub manifest_bytes: Vec<u8>,
    pub profile_bytes: Vec<u8>,
    pub manifest: ReleaseManifest,
    pub backend: String,
}

impl PackageInput {
    pub fn load(
        manifest: &OsStr,
        profile: &OsStr,
        backend: &OsStr,
    ) -> Result<Self, Box<dyn Error>> {
        let manifest_bytes = std::fs::read(manifest)?;
        let profile_bytes = std::fs::read(profile)?;
        let backend = backend
            .to_str()
            .ok_or_else(|| {
                CliFailure::boxed(ErrorCode::InvalidInput, "runtime backend must be Unicode")
            })?
            .to_owned();
        let manifest = ReleaseManifest::from_json(&manifest_bytes, &profile_bytes)?;
        manifest.assets_for_backend(&backend)?;
        Ok(Self {
            manifest_bytes,
            profile_bytes,
            manifest,
            backend,
        })
    }

    pub fn report_start(&self, reporter: &mut CommandOutput) -> std::io::Result<()> {
        if reporter.is_machine() {
            reporter.emit(CliEvent::PackageStarted {
                release_id: self.manifest.id.clone(),
                backend: self.backend.clone(),
                manifest_sha256: SourceHash::digest(&self.manifest_bytes).to_string(),
                profile_sha256: SourceHash::digest(&self.profile_bytes).to_string(),
            })?;
        }
        Ok(())
    }
}
