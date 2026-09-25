use std::{
    collections::BTreeMap,
    error::Error,
    fs,
    path::PathBuf,
    time::{SystemTime, UNIX_EPOCH},
};

use auralis_translation_eval::verify_flores;
use serde_json::{Value, json};
use sha2::{Digest, Sha256};

const LANGUAGES: [&str; 4] = ["jpn_Jpan", "rus_Cyrl", "zho_Hans", "zho_Hant"];
const SPLITS: [&str; 2] = ["dev", "devtest"];

struct Fixture {
    root: PathBuf,
    manifest: Value,
}

impl Fixture {
    fn new() -> Result<Self, Box<dyn Error>> {
        let nonce = SystemTime::now().duration_since(UNIX_EPOCH)?.as_nanos();
        let root =
            std::env::temp_dir().join(format!("auralis-flores-{}-{nonce}", std::process::id()));
        fs::create_dir_all(root.join("corpus"))?;
        let archive = b"fixture archive";
        fs::write(root.join("flores200_dataset.tar.gz"), archive)?;
        let mut splits = Vec::new();
        for split in SPLITS {
            fs::create_dir_all(root.join("corpus").join(split))?;
            let mut files = BTreeMap::new();
            let metadata = format!("metadata_{split}.tsv");
            let metadata_content =
                b"URL\tdomain\ttopic\thas_image\thas_hyperlink\nurl\tdomain\ttopic\t0\t0\n";
            fs::write(root.join("corpus").join(&metadata), metadata_content)?;
            files.insert(
                "metadata".to_owned(),
                json!({"path": metadata, "sha256": hash(metadata_content)}),
            );
            for language in LANGUAGES {
                let relative = format!("{split}/{language}.{split}");
                let content = format!("sample {language}\n");
                fs::write(root.join("corpus").join(&relative), content.as_bytes())?;
                files.insert(
                    language.to_owned(),
                    json!({"path": relative, "sha256": hash(content.as_bytes())}),
                );
            }
            splits.push(json!({"name": split, "expected_rows": 1, "files": files}));
        }
        let manifest = json!({
            "schema_version": 1,
            "dataset": "FLORES-200",
            "release": "fixture",
            "source_url": "https://example.invalid/fixture",
            "license_id": "CC-BY-SA-4.0",
            "archive": {"path": "flores200_dataset.tar.gz", "sha256": hash(archive)},
            "splits": splits
        });
        Ok(Self { root, manifest })
    }

    fn verify(&self) -> Result<auralis_translation_eval::VerificationReport, Box<dyn Error>> {
        let manifest_path = self.root.join("manifest.json");
        fs::write(&manifest_path, serde_json::to_vec(&self.manifest)?)?;
        Ok(verify_flores(
            &manifest_path,
            &self.root.join("flores200_dataset.tar.gz"),
            &self.root.join("corpus"),
        )?)
    }
}

impl Drop for Fixture {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.root);
    }
}

fn hash(bytes: &[u8]) -> String {
    format!("{:x}", Sha256::digest(bytes))
}

#[test]
fn accepts_aligned_and_pinned_sentences() -> Result<(), Box<dyn Error>> {
    let fixture = Fixture::new()?;
    let report = fixture.verify()?;
    assert_eq!(report.splits.get("dev"), Some(&1));
    assert_eq!(report.splits.get("devtest"), Some(&1));
    assert!(!report.subtitle_holdout);
    Ok(())
}

#[test]
fn rejects_changed_corpus_bytes() -> Result<(), Box<dyn Error>> {
    let fixture = Fixture::new()?;
    fs::write(fixture.root.join("corpus/dev/jpn_Jpan.dev"), "modified\n")?;
    let error = fixture.verify().err().ok_or("expected hash rejection")?;
    assert!(error.to_string().contains("SHA-256 mismatch"));
    Ok(())
}

#[test]
fn rejects_missing_rows_even_when_hash_is_updated() -> Result<(), Box<dyn Error>> {
    let mut fixture = Fixture::new()?;
    fixture.manifest["splits"][0]["expected_rows"] = json!(2);
    let error = fixture.verify().err().ok_or("expected row rejection")?;
    assert!(error.to_string().contains("row count mismatch"));
    Ok(())
}

#[test]
fn rejects_manifest_path_escape() -> Result<(), Box<dyn Error>> {
    let mut fixture = Fixture::new()?;
    fixture.manifest["splits"][0]["files"]["jpn_Jpan"]["path"] = json!("../outside");
    let error = fixture.verify().err().ok_or("expected path rejection")?;
    assert!(error.to_string().contains("invalid file entry"));
    Ok(())
}
