use super::prepared_edit::PreparedEdit;
use crate::repositories::{edit_provenance, edit_selection, result_repository};
use crate::{DbError, EditSpec, ResultRecord};
use auralis_translation::{ResultId, ReviewState};
use rusqlite::Connection;

pub(super) fn load(
    connection: &Connection,
    spec: &EditSpec,
    base: &ResultRecord,
    prepared: &PreparedEdit,
    expected_head: Option<ResultId>,
) -> Result<Option<ResultRecord>, DbError> {
    let exists: bool = connection.query_row(
        "SELECT EXISTS(SELECT 1 FROM results WHERE result_id = ?1)",
        [spec.result_id.to_string()],
        |row| row.get(0),
    )?;
    if !exists {
        return Ok(None);
    }
    let stored = result_repository::load_from_connection(connection, spec.result_id)?;
    let stored_edit = edit_selection::text(connection, spec.result_id, spec.segment_id)?;
    let origin_matches = match edit_provenance::load(connection, spec.result_id)? {
        Some(origin) => {
            origin.base_result_id == base.result_id
                && origin.observed_head_result_id == expected_head.unwrap_or(base.result_id)
                && origin.segment_id == spec.segment_id
        }
        None => expected_head.is_none() && base.revision.checked_add(1) == Some(stored.revision),
    };
    if origin_matches
        && stored.run_id == base.run_id
        && stored.source_hash == base.source_hash
        && stored.output_hash == prepared.output_hash
        && stored.selected == prepared.selected
        && stored.structural_evidence_json == prepared.evidence_json
        && stored.review_state == ReviewState::NeedsReview
        && stored_edit.as_deref() == Some(spec.lines.as_slice())
    {
        return Ok(Some(stored));
    }
    Err(DbError::Conflict(
        "edit result ID refers to different data or provenance",
    ))
}
