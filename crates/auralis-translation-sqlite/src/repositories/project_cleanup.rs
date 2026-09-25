use crate::DbError;
use auralis_translation::TranslationId;
use rusqlite::{Connection, OptionalExtension, params};

pub(crate) fn delete(
    connection: &mut Connection,
    translation_id: TranslationId,
    project_id: &str,
) -> Result<bool, DbError> {
    if project_id.is_empty() {
        return Err(DbError::InvalidSpec(
            "project identity is required for deletion",
        ));
    }
    let transaction = connection.transaction()?;
    let id = translation_id.to_string();
    let owner: Option<Option<String>> = transaction
        .query_row(
            "SELECT project_id FROM translations WHERE translation_id = ?1",
            [&id],
            |row| row.get(0),
        )
        .optional()?;
    if owner
        .as_ref()
        .is_some_and(|stored| stored.as_deref() != Some(project_id))
    {
        return Err(DbError::Conflict("translation belongs to another project"));
    }
    let deleted_owner: Option<String> = transaction
        .query_row(
            "SELECT project_id FROM deleted_translations WHERE translation_id = ?1",
            [&id],
            |row| row.get(0),
        )
        .optional()?;
    if deleted_owner
        .as_deref()
        .is_some_and(|stored| stored != project_id)
    {
        return Err(DbError::Conflict(
            "deleted translation belongs to another project",
        ));
    }
    transaction.execute(
        "INSERT INTO deleted_translations (translation_id, project_id) VALUES (?1, ?2)
         ON CONFLICT(translation_id) DO NOTHING",
        params![id, project_id],
    )?;
    transaction.execute(
        "DELETE FROM result_edit_selections WHERE result_id IN
         (SELECT result_id FROM results WHERE run_id IN
          (SELECT run_id FROM runs WHERE translation_id = ?1))",
        [&id],
    )?;
    transaction.execute(
        "DELETE FROM results WHERE run_id IN
         (SELECT run_id FROM runs WHERE translation_id = ?1)",
        [&id],
    )?;
    transaction.execute("DELETE FROM segment_edits WHERE translation_id = ?1", [&id])?;
    let removed = transaction.execute(
        "DELETE FROM translations WHERE translation_id = ?1 AND project_id = ?2",
        params![id, project_id],
    )?;
    transaction.commit()?;
    Ok(removed == 1)
}
