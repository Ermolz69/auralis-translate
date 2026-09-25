use std::{
    collections::{BTreeMap, BTreeSet},
    fs::{self, File},
    io::{BufReader, Read},
    path::{Component, Path},
};

use serde::Serialize;
use sha2::{Digest, Sha256};
use thiserror::Error;

use crate::manifest::Manifest;

const EXPECTED_SCHEMA: u32 = 1;
const EXPECTED_DATASET: &str = "FLORES-200";
const EXPECTED_SPLITS: [&str; 2] = ["dev", "devtest"];
const EXPECTED_LANGUAGES: [&str; 4] = ["jpn_Jpan", "rus_Cyrl", "zho_Hans", "zho_Hant"];
const METADATA_KEY: &str = "metadata";
const METADATA_HEADER: &str = "URL\tdomain\ttopic\thas_image\thas_hyperlink";

#[derive(Debug, Error)]
pub enum VerifyError {
    #[error("I/O error: {0}")]
    Io(#[from] std::io::Error),
    #[error("manifest JSON error: {0}")]
    Json(#[from] serde_json::Error),
    #[error("invalid FLORES manifest: {0}")]
    InvalidManifest(String),
    #[error("SHA-256 mismatch for {path}: expected {expected}, got {actual}")]
    HashMismatch {
        path: String,
        expected: String,
        actual: String,
    },
    #[error("row count mismatch for {path}: expected {expected}, got {actual}")]
    RowCount {
        path: String,
        expected: usize,
        actual: usize,
    },
}

#[derive(Debug, Serialize)]
pub struct VerificationReport {
    pub dataset: String,
    pub release: String,
    pub source_url: String,
    pub license_id: String,
    pub archive_sha256: String,
    pub splits: BTreeMap<String, usize>,
    pub use_scope: &'static str,
    pub subtitle_holdout: bool,
}

pub fn verify_flores(
    manifest_path: &Path,
    archive_path: &Path,
    corpus_root: &Path,
) -> Result<VerificationReport, VerifyError> {
    let manifest: Manifest = serde_json::from_slice(&fs::read(manifest_path)?)?;
    validate_manifest(&manifest)?;
    let root = fs::canonicalize(corpus_root)?;
    if !root.is_dir() {
        return Err(VerifyError::InvalidManifest(
            "corpus root is not a directory".into(),
        ));
    }
    let archive_name = archive_path.file_name().and_then(|name| name.to_str());
    if archive_name != Some(manifest.archive.path.as_str()) {
        return Err(VerifyError::InvalidManifest(
            "archive filename differs from manifest".into(),
        ));
    }
    check_hash(archive_path, &manifest.archive.sha256)?;

    let mut split_counts = BTreeMap::new();
    for split in &manifest.splits {
        for (key, entry) in &split.files {
            let path = confined_path(&root, &entry.path)?;
            check_hash(&path, &entry.sha256)?;
            let content = fs::read_to_string(&path)?;
            let mut lines = content.lines();
            let count = if key == METADATA_KEY {
                if lines.next() != Some(METADATA_HEADER) {
                    return Err(VerifyError::InvalidManifest(format!(
                        "unexpected metadata header: {}",
                        entry.path
                    )));
                }
                lines.count()
            } else {
                content.lines().count()
            };
            if count != split.expected_rows {
                return Err(VerifyError::RowCount {
                    path: entry.path.clone(),
                    expected: split.expected_rows,
                    actual: count,
                });
            }
            if content.lines().any(|line| line.is_empty()) {
                return Err(VerifyError::InvalidManifest(format!(
                    "empty corpus row: {}",
                    entry.path
                )));
            }
        }
        split_counts.insert(split.name.clone(), split.expected_rows);
    }
    Ok(VerificationReport {
        dataset: manifest.dataset,
        release: manifest.release,
        source_url: manifest.source_url,
        license_id: manifest.license_id,
        archive_sha256: manifest.archive.sha256,
        splits: split_counts,
        use_scope: "auxiliary_sentence_comparison_only",
        subtitle_holdout: false,
    })
}

fn validate_manifest(manifest: &Manifest) -> Result<(), VerifyError> {
    if manifest.schema_version != EXPECTED_SCHEMA
        || manifest.dataset != EXPECTED_DATASET
        || manifest.release.is_empty()
        || manifest.source_url.is_empty()
        || manifest.license_id.is_empty()
        || manifest.archive.path != "flores200_dataset.tar.gz"
        || !valid_hash(&manifest.archive.sha256)
    {
        return Err(VerifyError::InvalidManifest(
            "unsupported dataset, schema, or archive".into(),
        ));
    }
    let names = manifest
        .splits
        .iter()
        .map(|split| split.name.as_str())
        .collect::<BTreeSet<_>>();
    if names != EXPECTED_SPLITS.into_iter().collect()
        || manifest.splits.len() != EXPECTED_SPLITS.len()
    {
        return Err(VerifyError::InvalidManifest(
            "expected exactly dev and devtest".into(),
        ));
    }
    let expected_keys = EXPECTED_LANGUAGES
        .into_iter()
        .chain([METADATA_KEY])
        .collect::<BTreeSet<_>>();
    let mut seen_paths = BTreeSet::new();
    for split in &manifest.splits {
        if split.expected_rows == 0
            || split
                .files
                .keys()
                .map(String::as_str)
                .collect::<BTreeSet<_>>()
                != expected_keys
        {
            return Err(VerifyError::InvalidManifest(format!(
                "wrong files or row count for {}",
                split.name
            )));
        }
        for (key, file) in &split.files {
            let expected_path = if key == METADATA_KEY {
                format!("metadata_{}.tsv", split.name)
            } else {
                format!("{}/{}.{}", split.name, key, split.name)
            };
            if file.path != expected_path
                || !valid_hash(&file.sha256)
                || !seen_paths.insert(&file.path)
            {
                return Err(VerifyError::InvalidManifest(format!(
                    "invalid file entry: {}",
                    file.path
                )));
            }
        }
    }
    Ok(())
}

fn valid_hash(value: &str) -> bool {
    value.len() == 64 && value.bytes().all(|byte| byte.is_ascii_hexdigit())
}

fn confined_path(root: &Path, relative: &str) -> Result<std::path::PathBuf, VerifyError> {
    let path = Path::new(relative);
    if !path
        .components()
        .all(|part| matches!(part, Component::Normal(_)))
    {
        return Err(VerifyError::InvalidManifest(format!(
            "unsafe path: {relative}"
        )));
    }
    let resolved = fs::canonicalize(root.join(path))?;
    if !resolved.starts_with(root) || !resolved.is_file() {
        return Err(VerifyError::InvalidManifest(format!(
            "file escapes corpus root: {relative}"
        )));
    }
    Ok(resolved)
}

fn check_hash(path: &Path, expected: &str) -> Result<(), VerifyError> {
    let mut reader = BufReader::new(File::open(path)?);
    let mut hasher = Sha256::new();
    let mut buffer = [0_u8; 64 * 1024];
    loop {
        let length = reader.read(&mut buffer)?;
        if length == 0 {
            break;
        }
        hasher.update(&buffer[..length]);
    }
    let actual = format!("{:x}", hasher.finalize());
    if !actual.eq_ignore_ascii_case(expected) {
        return Err(VerifyError::HashMismatch {
            path: path.display().to_string(),
            expected: expected.into(),
            actual,
        });
    }
    Ok(())
}
