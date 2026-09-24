use crate::DbError;
use rusqlite::Connection;

pub const SCHEMA_VERSION: u32 = 1;
const INITIAL_SCHEMA: &str = include_str!("../migrations/0001_initial.sql");

pub(crate) fn apply(connection: &mut Connection) -> Result<(), DbError> {
    let current: u32 = connection.pragma_query_value(None, "user_version", |row| row.get(0))?;
    if current > SCHEMA_VERSION {
        return Err(DbError::UnsupportedSchemaVersion(current));
    }
    if current == SCHEMA_VERSION {
        return Ok(());
    }
    let transaction = connection.transaction()?;
    transaction.execute_batch(INITIAL_SCHEMA)?;
    transaction.pragma_update(None, "user_version", SCHEMA_VERSION)?;
    transaction.commit()?;
    Ok(())
}
