use crate::durable_workflow::DATABASE_FILE;
use auralis_translation::RunId;
use auralis_translation_sqlite::{SqliteConfig, TranslateDb};
use serde::Serialize;
use std::{error::Error, ffi::OsStr, path::Path};

const REPORT_SCHEMA_VERSION: u32 = 1;

#[derive(Serialize)]
struct DiagnosticItem {
    block_index: u32,
    segment_id: u32,
    line_index: u32,
    code: &'static str,
}

#[derive(Serialize)]
struct DiagnosticReport {
    schema_version: u32,
    run_id: String,
    warnings: Vec<DiagnosticItem>,
}

pub(crate) fn run(state_dir: &OsStr, run_id: &OsStr) -> Result<(), Box<dyn Error>> {
    let run_id = RunId::parse(run_id.to_str().ok_or("run ID must be Unicode")?)?;
    let database = Path::new(state_dir).join(DATABASE_FILE);
    if !database.is_file() {
        return Err("Translate database does not exist in state directory".into());
    }
    let db = TranslateDb::open(&database, SqliteConfig::default())?;
    db.run(run_id)?;
    let warnings = db
        .diagnostics(run_id)?
        .into_iter()
        .map(|item| DiagnosticItem {
            block_index: item.block_index,
            segment_id: item.diagnostic.segment_id.get(),
            line_index: item.diagnostic.line_index,
            code: item.diagnostic.code.as_str(),
        })
        .collect();
    let report = DiagnosticReport {
        schema_version: REPORT_SCHEMA_VERSION,
        run_id: run_id.to_string(),
        warnings,
    };
    println!("{}", serde_json::to_string_pretty(&report)?);
    Ok(())
}
