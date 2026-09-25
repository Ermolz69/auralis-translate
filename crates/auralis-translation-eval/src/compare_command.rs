use std::{
    error::Error,
    ffi::OsStr,
    fs::{self, OpenOptions},
    io::Write,
    path::Path,
};

use auralis_translation_eval::{ComparisonRequest, compare_flores, verify_flores};
use auralis_translation_llamacpp::{LlamaCppProvider, ModelProfile, verify_server};
use sha2::{Digest, Sha256};

const EVALUATION_CACHE_ROOT: &str = ".cache/eval";

pub(super) fn run(args: [&OsStr; 9]) -> Result<String, Box<dyn Error>> {
    let [
        manifest,
        archive,
        root,
        split,
        language,
        ids,
        profile_path,
        server,
        output,
    ] = args;
    let root = Path::new(root);
    let output = Path::new(output);
    let cache = fs::canonicalize(EVALUATION_CACHE_ROOT)?;
    let corpus_parent = fs::canonicalize(root.parent().ok_or("corpus root has no parent")?)?;
    let output_parent = fs::canonicalize(output.parent().ok_or("output has no parent")?)?;
    if corpus_parent != cache
        || !fs::canonicalize(root)?.starts_with(&cache)
        || !output_parent.starts_with(&cache)
        || output.extension() != Some(OsStr::new("json"))
    {
        return Err("comparison output must be a JSON file under the corpus cache".into());
    }
    if output.exists() {
        return Err("comparison output already exists".into());
    }
    verify_flores(Path::new(manifest), Path::new(archive), root)?;
    let split = split.to_str().ok_or("split is not Unicode")?;
    let language = language.to_str().ok_or("language is not Unicode")?;
    let ids = ids.to_str().ok_or("row IDs are not Unicode")?;
    let row_ids = ids
        .split(',')
        .map(str::parse::<usize>)
        .collect::<Result<Vec<_>, _>>()?;
    let profile_bytes = fs::read(Path::new(profile_path))?;
    let profile = ModelProfile::from_json(&profile_bytes)?;
    if profile.prompt_version != 1 || profile.model_file_bytes.is_none() {
        return Err("comparison requires a checked, context-free prompt-v1 profile".into());
    }
    let server = server.to_str().ok_or("server URL is not Unicode")?;
    let provider = LlamaCppProvider::new(server, profile.clone())?;
    let reported = verify_server(&provider, &profile)?
        .ok_or("checked model preflight returned no runtime identity")?;
    let request = ComparisonRequest {
        manifest_path: Path::new(manifest).to_path_buf(),
        archive_path: Path::new(archive).to_path_buf(),
        corpus_root: root.to_path_buf(),
        split: split.into(),
        language: language.into(),
        row_ids,
        profile_sha256: format!("{:x}", Sha256::digest(profile_bytes)),
        model_sha256: profile.model_file_sha256,
        runtime_build: reported.build_info,
    };
    let report = compare_flores(&request, &provider)?;
    let json = serde_json::to_vec_pretty(&report)?;
    let mut file = OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(output)?;
    file.write_all(&json)?;
    file.sync_all()?;
    Ok(format!(
        "verified auxiliary comparison: {} rows; report={}",
        report.rows.len(),
        output.display()
    ))
}
