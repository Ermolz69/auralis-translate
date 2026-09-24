use std::error::Error;
use std::path::Path;
use std::process::Command;
use std::time::{SystemTime, UNIX_EPOCH};

const SOURCE: &[u8] = include_bytes!("../../auralis-translation-formats/tests/fixtures/plain.srt");

#[test]
fn manual_render_preserves_source_and_refuses_existing_output() -> Result<(), Box<dyn Error>> {
    let nonce = SystemTime::now().duration_since(UNIX_EPOCH)?.as_nanos();
    let directory =
        std::env::temp_dir().join(format!("auralis-translate-{}-{nonce}", std::process::id()));
    std::fs::create_dir(&directory)?;
    let source = directory.join("source.srt");
    let manifest = directory.join("translations.json");
    let output = directory.join("output.srt");
    std::fs::write(&source, SOURCE)?;

    assert!(run(&["template", path(&source)?, path(&manifest)?])?.success());
    let mut json: serde_json::Value = serde_json::from_slice(&std::fs::read(&manifest)?)?;
    json["translations"][0]["lines"][0] = "Привет.".into();
    json["translations"][1]["lines"][0] = "Увидимся завтра.".into();
    json["translations"][1]["lines"][1] = "Пока.".into();
    std::fs::write(&manifest, serde_json::to_vec(&json)?)?;

    assert!(run(&["render", path(&source)?, path(&manifest)?, path(&output)?])?.success());
    assert_eq!(std::fs::read(&source)?, SOURCE);
    let translated = std::fs::read(&output)?;
    assert!(std::str::from_utf8(&translated)?.contains("Привет."));
    assert!(!run(&["render", path(&source)?, path(&manifest)?, path(&output)?])?.success());
    assert_eq!(std::fs::read(&output)?, translated);

    std::fs::remove_dir_all(directory)?;
    Ok(())
}

#[test]
fn changed_source_and_missing_segment_never_create_output() -> Result<(), Box<dyn Error>> {
    let nonce = SystemTime::now().duration_since(UNIX_EPOCH)?.as_nanos();
    let directory =
        std::env::temp_dir().join(format!("auralis-translate-{}-{nonce}", std::process::id()));
    std::fs::create_dir(&directory)?;
    let source = directory.join("source.srt");
    let manifest = directory.join("translations.json");
    let output = directory.join("output.srt");
    std::fs::write(&source, SOURCE)?;
    assert!(run(&["template", path(&source)?, path(&manifest)?])?.success());

    let mut changed = SOURCE.to_vec();
    changed.extend_from_slice(b"\n");
    std::fs::write(&source, &changed)?;
    assert!(!run(&["render", path(&source)?, path(&manifest)?, path(&output)?])?.success());
    assert!(!output.exists());

    std::fs::write(&source, SOURCE)?;
    let mut json: serde_json::Value = serde_json::from_slice(&std::fs::read(&manifest)?)?;
    json["translations"]
        .as_array_mut()
        .ok_or("missing translations")?
        .pop();
    std::fs::write(&manifest, serde_json::to_vec(&json)?)?;
    assert!(!run(&["render", path(&source)?, path(&manifest)?, path(&output)?])?.success());
    assert!(!output.exists());

    std::fs::remove_dir_all(directory)?;
    Ok(())
}

#[test]
fn oversized_source_is_rejected_before_creating_manifest() -> Result<(), Box<dyn Error>> {
    let nonce = SystemTime::now().duration_since(UNIX_EPOCH)?.as_nanos();
    let directory =
        std::env::temp_dir().join(format!("auralis-translate-{}-{nonce}", std::process::id()));
    std::fs::create_dir(&directory)?;
    let source = directory.join("oversized.srt");
    let manifest = directory.join("translations.json");
    let file = std::fs::File::create(&source)?;
    let limit = auralis_translation_formats::srt::SrtParsePolicy::default().max_bytes();
    file.set_len(limit as u64 + 1)?;
    drop(file);

    assert!(!run(&["template", path(&source)?, path(&manifest)?])?.success());
    assert!(!manifest.exists());
    std::fs::remove_dir_all(directory)?;
    Ok(())
}

fn path(path: &Path) -> Result<&str, Box<dyn Error>> {
    Ok(path.to_str().ok_or("path is not Unicode")?)
}

fn run(args: &[&str]) -> Result<std::process::ExitStatus, Box<dyn Error>> {
    Ok(Command::new(env!("CARGO_BIN_EXE_auralis-translation-cli"))
        .args(args)
        .status()?)
}
