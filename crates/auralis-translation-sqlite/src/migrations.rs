use crate::DbError;
use rusqlite::Connection;

pub const SCHEMA_VERSION: u32 = 2;
const INITIAL_SCHEMA: &str = include_str!("../migrations/0001_initial.sql");
const PAUSE_REQUEST_SCHEMA: &str = include_str!("../migrations/0002_pause_request.sql");

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
    transaction.pragma_update(None, "user_version", SCHEMA_VERSION)?;
    transaction.commit()?;
    Ok(())
}
