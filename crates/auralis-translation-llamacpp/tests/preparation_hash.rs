use auralis_translation::{ProviderError, SourceHash};
use auralis_translation_llamacpp::{hash_file, hash_file_with_control};
use std::{cell::Cell, error::Error};

const SOURCE_BYTES: usize = 512 * 1024;

#[test]
fn model_hash_stops_between_chunks_and_a_fresh_check_completes() -> Result<(), Box<dyn Error>> {
    let directory = tempfile::tempdir()?;
    let path = directory.path().join("synthetic.gguf");
    let source = vec![7; SOURCE_BYTES];
    std::fs::write(&path, &source)?;
    let checks = Cell::new(0);
    let control = || {
        checks.set(checks.get() + 1);
        if checks.get() == 4 {
            Err(ProviderError::Permanent("preparation cancelled".into()))
        } else {
            Ok(())
        }
    };
    let error = hash_file_with_control(&path, &control)
        .err()
        .ok_or("hash did not stop")?;
    assert_eq!(error.to_string(), "preparation cancelled");
    assert_eq!(checks.get(), 4);
    assert_eq!(
        hash_file(&path)?,
        (SourceHash::digest(&source), u64::try_from(SOURCE_BYTES)?)
    );
    assert_eq!(std::fs::read(path)?, source);
    Ok(())
}

#[test]
fn cancelled_preparation_does_not_open_the_model() {
    let control = || Err(ProviderError::Permanent("preparation cancelled".into()));
    let result = hash_file_with_control(std::path::Path::new("missing-model"), &control);
    assert!(
        matches!(result, Err(ProviderError::Permanent(message)) if message == "preparation cancelled")
    );
}
