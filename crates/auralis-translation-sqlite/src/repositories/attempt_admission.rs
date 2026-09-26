use crate::{AttemptStartGuard, DbError};
use auralis_translation::{RunId, RunState};
use rusqlite::{Connection, OptionalExtension};

pub(crate) fn capture(
    connection: &Connection,
    run_id: RunId,
) -> Result<AttemptStartGuard, DbError> {
    let row: Option<(String, i64)> = connection
        .query_row(
            "SELECT state, control_revision FROM runs WHERE run_id = ?1",
            [run_id.to_string()],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .optional()?;
    let (state, revision) = row.ok_or(DbError::Conflict("run does not exist"))?;
    let state = match state.as_str() {
        "requested" => RunState::Requested,
        "paused" => RunState::Paused,
        "failed" => RunState::Failed,
        "running" | "validated" => return Err(DbError::Conflict("run cannot admit a new attempt")),
        _ => return Err(DbError::CorruptRecord("unknown run state")),
    };
    AttemptStartGuard::new(
        run_id,
        state,
        u64::try_from(revision).map_err(|_| DbError::CorruptRecord("negative control revision"))?,
    )
}

pub(crate) fn check(connection: &Connection, guard: AttemptStartGuard) -> Result<(), DbError> {
    let (state, revision, pause): (String, i64, bool) = connection.query_row(
        "SELECT state, control_revision, pause_requested FROM runs WHERE run_id = ?1",
        [guard.run_id().to_string()],
        |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
    )?;
    let expected = match guard.state() {
        RunState::Requested => "requested",
        RunState::Paused => "paused",
        RunState::Failed => "failed",
        _ => return Err(DbError::InvalidSpec("invalid admission phase")),
    };
    if state != expected
        || u64::try_from(revision)
            .map_err(|_| DbError::CorruptRecord("negative control revision"))?
            != guard.control_revision()
    {
        if state == "paused" || pause {
            return Err(DbError::PauseRequested);
        }
        return Err(DbError::Conflict(
            "another attempt invalidated the admission guard",
        ));
    }
    Ok(())
}
