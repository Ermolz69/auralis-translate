use crate::{AttemptStartGuard, DbError, ModelPreflightOutcome};
use auralis_translation::RunId;
use rusqlite::{Connection, TransactionBehavior, params};

pub(crate) fn begin(connection: &mut Connection, guard: AttemptStartGuard) -> Result<i64, DbError> {
    let transaction = connection.transaction_with_behavior(TransactionBehavior::Immediate)?;
    super::attempt_admission::check(&transaction, guard)?;
    transaction.execute(
        "INSERT INTO diagnostics (run_id, stage, code, detail_json)
         VALUES (?1, 'model_preflight', 'pending', '{}')",
        [guard.run_id().to_string()],
    )?;
    let id = transaction.last_insert_rowid();
    transaction.commit()?;
    Ok(id)
}

pub(crate) fn finish(
    connection: &Connection,
    run_id: RunId,
    diagnostic_id: i64,
    outcome: ModelPreflightOutcome,
    detail: &serde_json::Value,
) -> Result<(), DbError> {
    if !detail.is_object() {
        return Err(DbError::InvalidSpec("invalid model preflight outcome"));
    }
    let changed = connection.execute(
        "UPDATE diagnostics SET code = ?3, detail_json = ?4
         WHERE diagnostic_id = ?1 AND run_id = ?2
           AND stage = 'model_preflight' AND code = 'pending'",
        params![
            diagnostic_id,
            run_id.to_string(),
            outcome.code(),
            detail.to_string()
        ],
    )?;
    if changed != 1 {
        return Err(DbError::Conflict(
            "model preflight is not pending for this run",
        ));
    }
    Ok(())
}
