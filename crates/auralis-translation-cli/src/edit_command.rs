use crate::durable_workflow::DATABASE_FILE;
use crate::edit_payload::EditPayload;
use crate::loaded_run::load;
use crate::write_new::write_new;
use auralis_translation::{ResultId, SourceHash};
use auralis_translation_sqlite::{EditSpec, SqliteConfig, TranslateDb};
use std::error::Error;
use std::ffi::OsStr;
use std::path::Path;
use uuid::Uuid;

pub(crate) fn run(
    state_dir: &OsStr,
    base_result_id: &OsStr,
    profile_path: &OsStr,
    edit_path: &OsStr,
    output_path: &OsStr,
) -> Result<(), Box<dyn Error>> {
    let output_path = Path::new(output_path);
    if output_path.exists() {
        return Err("output already exists".into());
    }
    let base_result_id = ResultId::parse(
        base_result_id
            .to_str()
            .ok_or("base result ID must be Unicode")?,
    )?;
    let database = Path::new(state_dir).join(DATABASE_FILE);
    if !database.is_file() {
        return Err("Translate database does not exist in state directory".into());
    }
    let db = TranslateDb::open(&database, SqliteConfig::default())?;
    let base = db.result(base_result_id)?;
    drop(db);
    let mut loaded = load(state_dir, base.run_id, profile_path)?;
    let (segment_id, payload) = EditPayload::read(Path::new(edit_path))?;
    let result_id = ResultId::new(Uuid::new_v4()).ok_or("failed to create result ID")?;
    let result = loaded.db.commit_edit(
        &EditSpec {
            base_result_id,
            result_id,
            segment_id,
            lines: payload.lines,
        },
        &loaded.plan,
    )?;
    let output = loaded.plan.render_selected(&result.selected)?;
    if SourceHash::digest(&output) != result.output_hash {
        return Err("edited output hash differs from verified result".into());
    }
    write_new(output_path, &output)?;
    println!("result_id={result_id} review=needs_review");
    Ok(())
}
