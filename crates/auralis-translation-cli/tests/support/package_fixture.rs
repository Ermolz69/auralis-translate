use super::machine_workspace::MachineWorkspace;
use auralis_translation::SourceHash;
use serde_json::{Value, json};
use std::{error::Error, fs::File, io::Write, path::PathBuf};
use zip::{ZipWriter, write::SimpleFileOptions};

const PROFILE: &[u8] =
    include_bytes!("../../../../models/manifests/hy_mt2_1_8b_q4_k_m.checked.experimental.json");
const MANIFEST: &[u8] = include_bytes!(
    "../../../../models/releases/hy_mt2_1_8b_q4_k_m.windows_x64_cpu.experimental.json"
);

pub struct PackageFixture {
    pub workspace: MachineWorkspace,
    pub manifest: PathBuf,
    pub profile: PathBuf,
    pub assets: PathBuf,
    pub release_id: String,
}

impl PackageFixture {
    pub fn new(unsafe_archive: bool) -> Result<Self, Box<dyn Error>> {
        let workspace = MachineWorkspace::new()?;
        let assets = workspace.0.join("模型 cache with spaces");
        std::fs::create_dir(&assets)?;
        let mut profile: Value = serde_json::from_slice(PROFILE)?;
        let mut manifest: Value = serde_json::from_slice(MANIFEST)?;
        let model = b"synthetic model bytes, not valid GGUF";
        let archive = assets.join("llama-b10977-bin-win-cpu-x64.zip");
        let mut writer = ZipWriter::new(File::create(&archive)?);
        writer.start_file(
            if unsafe_archive {
                "../escaped.txt"
            } else {
                "llama-server.exe"
            },
            SimpleFileOptions::default(),
        )?;
        writer.write_all(b"synthetic executable, never run")?;
        writer.finish()?;
        for (pointer, bytes) in [
            ("/model/file", model.as_slice()),
            (
                "/model/license/notice",
                b"synthetic model notice".as_slice(),
            ),
            (
                "/runtime/license/notice",
                b"synthetic runtime notice".as_slice(),
            ),
        ] {
            let asset = manifest
                .pointer_mut(pointer)
                .ok_or("missing fixture asset")?;
            asset["sha256"] = json!(SourceHash::digest(bytes).to_string());
            asset["bytes"] = json!(bytes.len());
            let filename = asset["filename"]
                .as_str()
                .ok_or("missing fixture filename")?;
            std::fs::write(assets.join(filename), bytes)?;
        }
        let archive_bytes = std::fs::read(archive)?;
        manifest["runtime"]["variants"][0]["archive"]["sha256"] =
            json!(SourceHash::digest(&archive_bytes).to_string());
        manifest["runtime"]["variants"][0]["archive"]["bytes"] = json!(archive_bytes.len());
        profile["model_file_sha256"] = json!(SourceHash::digest(model).to_string());
        profile["model_file_bytes"] = json!(model.len());
        let profile_bytes = serde_json::to_vec(&profile)?;
        manifest["profile_sha256"] = json!(SourceHash::digest(&profile_bytes).to_string());
        let release_id = manifest["id"]
            .as_str()
            .ok_or("missing fixture release ID")?
            .into();
        let manifest_path = workspace.0.join("release.json");
        let profile_path = workspace.0.join("profile.json");
        std::fs::write(&manifest_path, serde_json::to_vec(&manifest)?)?;
        std::fs::write(&profile_path, profile_bytes)?;
        Ok(Self {
            workspace,
            manifest: manifest_path,
            profile: profile_path,
            assets,
            release_id,
        })
    }

    pub fn request(&self, command: &str, install_root: &std::path::Path) -> Value {
        let mut request = json!({"command": command, "manifest": self.manifest, "profile": self.profile, "backend": "cpu"});
        match command {
            "fetch-release" | "fetch-asset" => request["cache_dir"] = json!(self.assets),
            "install-offline" => {
                request["source_dir"] = json!(self.assets);
                request["install_root"] = json!(install_root);
            }
            "install-online" => {
                request["cache_dir"] = json!(self.assets);
                request["install_root"] = json!(install_root);
            }
            _ => {}
        }
        if command == "fetch-asset" {
            request["filename"] = json!("MODEL-LICENSE.txt");
        }
        json!({"schema_version": 1, "request": request})
    }
}
