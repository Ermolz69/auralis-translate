use crate::repositories::{edit_selection, result_repository};
use crate::{DbError, EditProvenance};
use auralis_translation::{ResultId, SegmentId};
use rusqlite::{Connection, OptionalExtension, params};

pub(crate) fn load(
    connection: &Connection,
    result_id: ResultId,
) -> Result<Option<EditProvenance>, DbError> {
    let result = result_repository::load_from_connection(connection, result_id)?;
    let stored: Option<(String, String, u32)> = connection.query_row("SELECT base_result_id, observed_head_result_id, segment_id FROM result_edit_provenance WHERE result_id = ?1", [result_id.to_string()], |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?))).optional()?;
    let Some((base_id, head_id, segment_id)) = stored else {
        return Ok(None);
    };
    let origin = EditProvenance {
        base_result_id: ResultId::parse(&base_id)
            .map_err(|_| DbError::CorruptRecord("invalid edit base ID"))?,
        observed_head_result_id: ResultId::parse(&head_id)
            .map_err(|_| DbError::CorruptRecord("invalid edit head ID"))?,
        segment_id: SegmentId::new(segment_id)
            .ok_or(DbError::CorruptRecord("invalid edited segment ID"))?,
    };
    let base = result_repository::load_from_connection(connection, origin.base_result_id)?;
    let head = result_repository::load_from_connection(connection, origin.observed_head_result_id)?;
    if result.run_id != base.run_id
        || result.run_id != head.run_id
        || result.source_hash != base.source_hash
        || result.source_hash != head.source_hash
        || head.revision.checked_add(1) != Some(result.revision)
        || base.revision > head.revision
        || result.selected.len() != base.selected.len()
    {
        return Err(DbError::CorruptRecord(
            "edit ancestry differs from result run, source or revision",
        ));
    }
    let mut changed = false;
    for (edited, original) in result.selected.iter().zip(&base.selected) {
        if edited.id != original.id {
            return Err(DbError::CorruptRecord(
                "edit ancestry changed segment identity",
            ));
        }
        if edited.id == origin.segment_id {
            if edited.lines.len() != original.lines.len() || edited.lines == original.lines {
                return Err(DbError::CorruptRecord(
                    "edit ancestry has no valid changed segment",
                ));
            }
            if edit_selection::text(connection, result_id, origin.segment_id)?.as_ref()
                != Some(&edited.lines)
            {
                return Err(DbError::CorruptRecord(
                    "edit ancestry differs from selected manual text",
                ));
            }
            changed = true;
        } else if edited != original {
            return Err(DbError::CorruptRecord(
                "edit changed an unselected base segment",
            ));
        }
    }
    if !changed {
        return Err(DbError::CorruptRecord("edit ancestry segment is absent"));
    }
    Ok(Some(origin))
}

pub(crate) fn insert(
    connection: &Connection,
    result_id: ResultId,
    base_result_id: ResultId,
    observed_head_result_id: ResultId,
    segment_id: SegmentId,
) -> Result<(), DbError> {
    connection.execute("INSERT INTO result_edit_provenance (result_id, base_result_id, observed_head_result_id, segment_id) VALUES (?1, ?2, ?3, ?4)", params![result_id.to_string(), base_result_id.to_string(), observed_head_result_id.to_string(), segment_id.get()])?;
    Ok(())
}
