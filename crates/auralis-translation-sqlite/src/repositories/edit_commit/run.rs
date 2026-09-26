use super::{prepare, retry, write};
use crate::repositories::result_repository;
use crate::{DbError, EditSpec, ResultRecord};
use auralis_translation::{ResultId, VerifiedRenderer};
use rusqlite::{Connection, TransactionBehavior};

pub(crate) fn run<V: VerifiedRenderer>(
    connection: &mut Connection,
    spec: &EditSpec,
    expected_head_result_id: Option<ResultId>,
    renderer: &V,
) -> Result<ResultRecord, DbError> {
    let transaction = connection.transaction_with_behavior(TransactionBehavior::Immediate)?;
    let base = result_repository::load_from_connection(&transaction, spec.base_result_id)?;
    let prepared = prepare::run(spec, &base, renderer)?;
    if let Some(stored) = retry::load(
        &transaction,
        spec,
        &base,
        &prepared,
        expected_head_result_id,
    )? {
        return Ok(stored);
    }
    let run: (String, String) = transaction.query_row(
        "SELECT translation_id, state FROM runs WHERE run_id = ?1",
        [base.run_id.to_string()],
        |row| Ok((row.get(0)?, row.get(1)?)),
    )?;
    if run.1 != "validated" {
        return Err(DbError::Conflict("edit base run is not validated"));
    }
    let head = result_repository::for_run(&transaction, base.run_id)?;
    if head.result_id != expected_head_result_id.unwrap_or(base.result_id) {
        return Err(DbError::Conflict("observed result head is stale"));
    }
    if head.source_hash != base.source_hash || base.revision > head.revision {
        return Err(DbError::CorruptRecord(
            "edit head differs from base run source or order",
        ));
    }
    let stored = write::run(&transaction, spec, &base, &head, &prepared, &run.0)?;
    transaction.commit()?;
    Ok(stored)
}
