use super::prepared_edit::PreparedEdit;
use crate::repositories::{checkpoint_repository, edit_provenance, result_repository};
use crate::{DbError, EditSpec, ResultRecord};
use rusqlite::{Connection, params};

pub(super) fn run(
    connection: &Connection,
    spec: &EditSpec,
    base: &ResultRecord,
    head: &ResultRecord,
    prepared: &PreparedEdit,
    translation_id: &str,
) -> Result<ResultRecord, DbError> {
    let next_revision = head
        .revision
        .checked_add(1)
        .ok_or(DbError::InvalidSpec("result revision exhausted"))?;
    let previous_edit: Option<u32> = connection.query_row(
        "SELECT MAX(revision) FROM segment_edits WHERE translation_id = ?1 AND segment_id = ?2",
        params![translation_id, spec.segment_id.get()],
        |row| row.get(0),
    )?;
    let edit_revision = previous_edit
        .unwrap_or(0)
        .checked_add(1)
        .ok_or(DbError::InvalidSpec("segment edit revision exhausted"))?;
    connection.execute("INSERT INTO segment_edits (translation_id, segment_id, revision, text_lines_json, provenance) VALUES (?1, ?2, ?3, ?4, 'manual')", params![translation_id, spec.segment_id.get(), edit_revision, serde_json::to_string(&spec.lines)?])?;
    connection.execute("INSERT INTO results (result_id, run_id, revision, source_sha256, output_sha256, selected_segments_json, structural_evidence_json, review_state) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 'needs_review')", params![spec.result_id.to_string(), base.run_id.to_string(), next_revision, base.source_hash.to_string(), prepared.output_hash.to_string(), checkpoint_repository::encode_segments(&prepared.selected)?, prepared.evidence_json])?;
    connection.execute("INSERT INTO result_edit_selections (result_id, translation_id, segment_id, edit_revision) SELECT ?1, translation_id, segment_id, edit_revision FROM result_edit_selections WHERE result_id = ?2 AND segment_id != ?3", params![spec.result_id.to_string(), spec.base_result_id.to_string(), spec.segment_id.get()])?;
    connection.execute("INSERT INTO result_edit_selections (result_id, translation_id, segment_id, edit_revision) VALUES (?1, ?2, ?3, ?4)", params![spec.result_id.to_string(), translation_id, spec.segment_id.get(), edit_revision])?;
    edit_provenance::insert(
        connection,
        spec.result_id,
        base.result_id,
        head.result_id,
        spec.segment_id,
    )?;
    result_repository::load_from_connection(connection, spec.result_id)
}
