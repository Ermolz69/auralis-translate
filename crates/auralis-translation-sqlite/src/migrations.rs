use crate::DbError;
use rusqlite::Connection;

pub const SCHEMA_VERSION: u32 = 8;
const INFERENCE_PREFLIGHT_SCHEMA: &str = include_str!("../migrations/0008_inference_preflight.sql");
const INFERENCE_REQUESTS_SCHEMA: &str = include_str!("../migrations/0007_inference_requests.sql");
const RESULT_EDIT_PROVENANCE_SCHEMA: &str =
    include_str!("../migrations/0006_result_edit_provenance.sql");
const CONTROL_REVISION_SCHEMA: &str = include_str!("../migrations/0005_control_revision.sql");
const INITIAL_SCHEMA: &str = include_str!("../migrations/0001_initial.sql");
const PAUSE_REQUEST_SCHEMA: &str = include_str!("../migrations/0002_pause_request.sql");
const RESULT_EDIT_SELECTIONS_SCHEMA: &str =
    include_str!("../migrations/0003_result_edit_selections.sql");
const DELETED_TRANSLATIONS_SCHEMA: &str =
    include_str!("../migrations/0004_deleted_translations.sql");

pub(crate) fn apply(connection: &mut Connection) -> Result<(), DbError> {
    let current: u32 = connection.pragma_query_value(None, "user_version", |row| row.get(0))?;
    if current > SCHEMA_VERSION {
        return Err(DbError::UnsupportedSchemaVersion(current));
    }
    if current == SCHEMA_VERSION {
        return Ok(());
    }
    let transaction = connection.transaction()?;
    if current < 1 {
        transaction.execute_batch(INITIAL_SCHEMA)?;
    }
    if current < 2 {
        transaction.execute_batch(PAUSE_REQUEST_SCHEMA)?;
    }
    if current < 3 {
        transaction.execute_batch(RESULT_EDIT_SELECTIONS_SCHEMA)?;
    }
    if current < 4 {
        transaction.execute_batch(DELETED_TRANSLATIONS_SCHEMA)?;
    }
    if current < 5 {
        transaction.execute_batch(CONTROL_REVISION_SCHEMA)?;
    }
    if current < 6 {
        transaction.execute_batch(RESULT_EDIT_PROVENANCE_SCHEMA)?;
    }
    if current < 7 {
        transaction.execute_batch(INFERENCE_REQUESTS_SCHEMA)?;
    }
    if current < 8 {
        transaction.execute_batch(INFERENCE_PREFLIGHT_SCHEMA)?;
    }
    transaction.pragma_update(None, "user_version", SCHEMA_VERSION)?;
    transaction.commit()?;
    Ok(())
}
