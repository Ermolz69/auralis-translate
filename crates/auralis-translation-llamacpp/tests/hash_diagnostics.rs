#[path = "support/captured_writer.rs"]
mod captured_writer;

use auralis_translation::{ProviderError, SourceHash};
use auralis_translation_llamacpp::{hash_file, hash_file_with_control};
use captured_writer::CapturedWriter;
use std::{cell::Cell, error::Error};

const SOURCE_BYTES: usize = 512 * 1024;

#[test]
fn observed_partial_read_finishes_failed_and_fresh_check_has_distinct_complete_identity()
-> Result<(), Box<dyn Error>> {
    let directory = tempfile::tempdir()?;
    let path = directory.path().join("synthetic.gguf");
    let source = vec![7; SOURCE_BYTES];
    std::fs::write(&path, &source)?;
    let capture = CapturedWriter::default();
    let writer = capture.clone();
    let subscriber = tracing_subscriber::fmt()
        .json()
        .without_time()
        .with_ansi(false)
        .with_writer(move || writer.clone())
        .finish();
    let checks = Cell::new(0);
    tracing::subscriber::with_default(subscriber, || -> Result<(), Box<dyn Error>> {
        let control = || {
            checks.set(checks.get() + 1);
            if checks.get() == 4 {
                Err(ProviderError("preparation cancelled".into()))
            } else {
                Ok(())
            }
        };
        assert!(hash_file_with_control(&path, &control).is_err());
        assert_eq!(checks.get(), 4);
        assert_eq!(
            hash_file(&path)?,
            (SourceHash::digest(&source), SOURCE_BYTES as u64)
        );
        Ok(())
    })?;
    let records = capture.records()?;
    assert_eq!(records.len(), 4);
    let fields = records
        .iter()
        .map(|record| &record["fields"])
        .collect::<Vec<_>>();
    assert_eq!(fields[0]["event_name"], "translation_model_hash_started");
    assert_eq!(fields[1]["event_name"], "translation_model_hash_finished");
    assert_eq!(fields[0]["hash_operation"], fields[1]["hash_operation"]);
    assert_eq!(fields[1]["outcome"], "failed");
    let started_bytes = fields[0]["hashed_bytes"]
        .as_u64()
        .ok_or("missing start bytes")?;
    let failed_bytes = fields[1]["hashed_bytes"]
        .as_u64()
        .ok_or("missing final bytes")?;
    assert!(
        started_bytes > 0 && started_bytes <= failed_bytes && failed_bytes < SOURCE_BYTES as u64
    );
    assert_eq!(fields[2]["event_name"], "translation_model_hash_started");
    assert_eq!(fields[3]["event_name"], "translation_model_hash_finished");
    assert_ne!(fields[0]["hash_operation"], fields[2]["hash_operation"]);
    assert_eq!(fields[2]["hash_operation"], fields[3]["hash_operation"]);
    assert_eq!(fields[3]["outcome"], "completed");
    assert_eq!(fields[3]["hashed_bytes"], SOURCE_BYTES);
    for fields in fields {
        assert_eq!(fields["total_bytes"], SOURCE_BYTES);
        assert!(fields.get("path").is_none() && fields.get("error").is_none());
    }
    assert_eq!(std::fs::read(path)?, source);
    Ok(())
}

#[test]
fn cancelled_before_open_has_no_started_record_or_observed_bytes() -> Result<(), Box<dyn Error>> {
    let capture = CapturedWriter::default();
    let writer = capture.clone();
    let subscriber = tracing_subscriber::fmt()
        .json()
        .without_time()
        .with_ansi(false)
        .with_writer(move || writer.clone())
        .finish();
    tracing::subscriber::with_default(subscriber, || {
        let result = hash_file_with_control(std::path::Path::new("missing-model"), &|| {
            Err(ProviderError("preparation cancelled".into()))
        });
        assert!(
            matches!(result, Err(ProviderError(message)) if message == "preparation cancelled")
        );
    });
    let records = capture.records()?;
    assert_eq!(records.len(), 1);
    assert_eq!(
        records[0]["fields"]["event_name"],
        "translation_model_hash_finished"
    );
    assert_eq!(records[0]["fields"]["hashed_bytes"], 0);
    assert_eq!(records[0]["fields"]["total_bytes"], 0);
    assert_eq!(records[0]["fields"]["outcome"], "failed");
    Ok(())
}
