use crate::{AttemptId, DbError, RunStop};
use auralis_translation::{RunId, RunState};
use rusqlite::{Connection, OptionalExtension, params};

pub(crate) fn begin(
    connection: &mut Connection,
    run_id: RunId,
    host_job_id: Option<&str>,
) -> Result<AttemptId, DbError> {
    if host_job_id.is_some_and(str::is_empty) {
        return Err(DbError::InvalidSpec("empty host job ID"));
    }
    let transaction = connection.transaction()?;
    let changed = transaction.execute(
        "UPDATE runs SET state = 'running', updated_at = unixepoch()
         WHERE run_id = ?1 AND state IN ('requested', 'paused', 'failed')",
        [run_id.to_string()],
    )?;
    if changed != 1 {
        return Err(DbError::Conflict("run is not ready for a new attempt"));
    }
    transaction.execute(
        "INSERT INTO run_attempts (run_id, host_job_id) VALUES (?1, ?2)",
        params![run_id.to_string(), host_job_id],
    )?;
    let attempt_id = AttemptId(transaction.last_insert_rowid());
    transaction.commit()?;
    Ok(attempt_id)
}

pub(crate) fn stop(
    connection: &mut Connection,
    run_id: RunId,
    attempt_id: AttemptId,
    stop: RunStop,
    reason: &str,
) -> Result<(), DbError> {
    if reason.is_empty() {
        return Err(DbError::InvalidSpec("attempt stop reason is empty"));
    }
    let state = match stop {
        RunStop::Paused => "paused",
        RunStop::Failed => "failed",
    };
    let transaction = connection.transaction()?;
    let changed = transaction.execute(
        "UPDATE run_attempts SET ended_at = unixepoch(), stop_reason = ?3
         WHERE run_id = ?1 AND attempt_id = ?2 AND ended_at IS NULL",
        params![run_id.to_string(), attempt_id.get(), reason],
    )?;
    if changed != 1 {
        return Err(DbError::Conflict("attempt is not open for this run"));
    }
    let changed = transaction.execute(
        "UPDATE runs SET state = ?2, updated_at = unixepoch()
         WHERE run_id = ?1 AND state = 'running'",
        params![run_id.to_string(), state],
    )?;
    if changed != 1 {
        return Err(DbError::Conflict("run is not running"));
    }
    transaction.commit()?;
    Ok(())
}

pub(crate) fn recover_interrupted(
    connection: &mut Connection,
    run_id: RunId,
) -> Result<bool, DbError> {
    let transaction = connection.transaction()?;
    let state = read_state(&transaction, run_id)?;
    if state != RunState::Running {
        transaction.commit()?;
        return Ok(false);
    }
    let changed = transaction.execute(
        "UPDATE run_attempts SET ended_at = unixepoch(), stop_reason = 'interrupted'
         WHERE run_id = ?1 AND ended_at IS NULL",
        [run_id.to_string()],
    )?;
    if changed != 1 {
        return Err(DbError::CorruptRecord(
            "running run does not have one open attempt",
        ));
    }
    transaction.execute(
        "UPDATE runs SET state = 'paused', updated_at = unixepoch() WHERE run_id = ?1",
        [run_id.to_string()],
    )?;
    transaction.commit()?;
    Ok(true)
}

pub(crate) fn state(connection: &Connection, run_id: RunId) -> Result<RunState, DbError> {
    read_state(connection, run_id)
}

fn read_state(connection: &Connection, run_id: RunId) -> Result<RunState, DbError> {
    let value: Option<String> = connection
        .query_row(
            "SELECT state FROM runs WHERE run_id = ?1",
            [run_id.to_string()],
            |row| row.get(0),
        )
        .optional()?;
    match value.as_deref() {
        Some("requested") => Ok(RunState::Requested),
        Some("running") => Ok(RunState::Running),
        Some("paused") => Ok(RunState::Paused),
        Some("failed") => Ok(RunState::Failed),
        Some("validated") => Ok(RunState::Validated),
        Some(_) => Err(DbError::CorruptRecord("unknown run state")),
        None => Err(DbError::Conflict("run does not exist")),
    }
}
