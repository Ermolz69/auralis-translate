use serde_json::{Value, json};
use sha2::{Digest, Sha256};
use std::error::Error;
use std::fs::File;
use std::io::Write;
use std::path::{Path, PathBuf};
use zip::ZipWriter;
use zip::write::SimpleFileOptions;

const PROFILE: &[u8] =
    include_bytes!("../../../../models/manifests/hy_mt2_1_8b_q4_k_m.checked.experimental.json");
const MANIFEST: &[u8] = include_bytes!(
    "../../../../models/releases/hy_mt2_1_8b_q4_k_m.windows_x64_cpu.experimental.json"
);

pub struct Fixture {
    pub manifest: Vec<u8>,
    pub profile: Vec<u8>,
    pub sources: PathBuf,
}

fn digest(bytes: &[u8]) -> String {
    format!("{:x}", Sha256::digest(bytes))
}

pub fn make_zip(path: &Path, name: &str) -> Result<(), Box<dyn Error>> {
    let mut writer = ZipWriter::new(File::create(path)?);
    writer.start_file(name, SimpleFileOptions::default())?;
    writer.write_all(b"stub server")?;
    writer.finish()?;
    Ok(())
}

pub fn fixture_with_archive<F>(root: &Path, write_archive: F) -> Result<Fixture, Box<dyn Error>>
where
    F: FnOnce(&Path) -> Result<(), Box<dyn Error>>,
{
    let sources = root.join("sources");
    std::fs::create_dir(&sources)?;
    let model = b"tiny fixture model";
    let model_license = b"fixture model license";
    let runtime_license = b"fixture runtime license";
    let archive = sources.join("llama-b10977-bin-win-cpu-x64.zip");
    write_archive(&archive)?;
    let archive_bytes = std::fs::read(archive)?;
    std::fs::write(sources.join("Hy-MT2-1.8B-Q4_K_M.gguf"), model)?;
    std::fs::write(sources.join("MODEL-LICENSE.txt"), model_license)?;
    std::fs::write(sources.join("LLAMA-LICENSE.txt"), runtime_license)?;

    let mut profile: Value = serde_json::from_slice(PROFILE)?;
    profile["model_file_sha256"] = json!(digest(model));
    profile["model_file_bytes"] = json!(model.len());
    let profile_bytes = serde_json::to_vec(&profile)?;

    let mut manifest: Value = serde_json::from_slice(MANIFEST)?;
    manifest["profile_sha256"] = json!(digest(&profile_bytes));
    manifest["model"]["file"]["sha256"] = json!(digest(model));
    manifest["model"]["file"]["bytes"] = json!(model.len());
    manifest["model"]["license"]["notice"]["sha256"] = json!(digest(model_license));
    manifest["model"]["license"]["notice"]["bytes"] = json!(model_license.len());
    manifest["runtime"]["license"]["notice"]["sha256"] = json!(digest(runtime_license));
    manifest["runtime"]["license"]["notice"]["bytes"] = json!(runtime_license.len());
    manifest["runtime"]["variants"][0]["archive"]["sha256"] = json!(digest(&archive_bytes));
    manifest["runtime"]["variants"][0]["archive"]["bytes"] = json!(archive_bytes.len());
    Ok(Fixture {
        manifest: serde_json::to_vec(&manifest)?,
        profile: profile_bytes,
        sources,
    })
}
