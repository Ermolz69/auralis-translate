use crate::durable_workflow::DATABASE_FILE;
use auralis_translation::RunId;
use auralis_translation_sqlite::{SqliteConfig, TranslateDb};
use std::{error::Error, ffi::OsStr, path::Path};

pub(crate) fn run(state_dir: &OsStr, run_id: &OsStr) -> Result<(), Box<dyn Error>> {
    let database = Path::new(state_dir).join(DATABASE_FILE);
    if !database.is_file() {
        return Err("Translate database does not exist in state directory".into());
    }
    let run_id = RunId::parse(run_id.to_str().ok_or("run ID must be Unicode")?)?;
    let db = TranslateDb::open(&database, SqliteConfig::default())?;
    db.request_pause(run_id)?;
    println!("run_id={run_id} pause_requested=true");
    Ok(())
}
