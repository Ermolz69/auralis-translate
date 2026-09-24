use super::{checkpoint_repository, edit_selection, result_repository};
use crate::{DbError, EditSpec, ResultRecord};
use auralis_translation::{ReviewState, SourceHash, VerifiedRenderer};
use rusqlite::{Connection, OptionalExtension, TransactionBehavior, params};

pub(crate) fn commit<V: VerifiedRenderer>(
    connection: &mut Connection,
    spec: &EditSpec,
    renderer: &V,
) -> Result<ResultRecord, DbError> {
    if spec.base_result_id == spec.result_id || spec.lines.is_empty() {
        return Err(DbError::InvalidSpec(
            "edit requires a new result and nonempty lines",
        ));
    }
    let evidence_json = renderer.structural_evidence();
    let evidence: serde_json::Value = serde_json::from_str(evidence_json)
        .map_err(|_| DbError::InvalidSpec("invalid structural evidence JSON"))?;
    if !evidence.is_object() {
        return Err(DbError::InvalidSpec(
            "structural evidence must be an object",
        ));
    }
    let transaction = connection.transaction_with_behavior(TransactionBehavior::Immediate)?;
    let base = result_repository::load_from_connection(&transaction, spec.base_result_id)?;
    if renderer.source_hash() != base.source_hash {
        return Err(DbError::Conflict(
            "edit renderer source differs from base result",
        ));
    }
    let base_output = renderer
        .render_selected(&base.selected)
        .map_err(|error| DbError::Verification(error.to_string()))?;
    if SourceHash::digest(&base_output) != base.output_hash {
        return Err(DbError::CorruptRecord(
            "edit base result output digest differs from its selection",
        ));
    }
    let next_revision = base
        .revision
        .checked_add(1)
        .ok_or(DbError::InvalidSpec("result revision exhausted"))?;
    let mut selected = base.selected.clone();
    let segment = selected
        .iter_mut()
        .find(|segment| segment.id == spec.segment_id)
        .ok_or(DbError::InvalidSpec(
            "edited segment is absent from base result",
        ))?;
    if segment.lines.len() != spec.lines.len() || segment.lines == spec.lines {
        return Err(DbError::InvalidSpec(
            "edit must change text while preserving line count",
        ));
    }
    segment.lines.clone_from(&spec.lines);
    let output = renderer
        .render_selected(&selected)
        .map_err(|error| DbError::Verification(error.to_string()))?;
    if output.is_empty() {
        return Err(DbError::Verification("rendered output is empty".into()));
    }
    let output_hash = SourceHash::digest(&output);
    let existing: Option<u32> = transaction
        .query_row(
            "SELECT 1 FROM results WHERE result_id = ?1",
            [spec.result_id.to_string()],
            |row| row.get(0),
        )
        .optional()?;
    if existing.is_some() {
        let stored = result_repository::load_from_connection(&transaction, spec.result_id)?;
        let stored_edit = edit_selection::text(&transaction, spec.result_id, spec.segment_id)?;
        if stored.run_id == base.run_id
            && stored.revision == next_revision
            && stored.source_hash == base.source_hash
            && stored.output_hash == output_hash
            && stored.selected == selected
            && stored.structural_evidence_json == evidence_json
            && stored.review_state == ReviewState::NeedsReview
            && stored_edit.as_deref() == Some(spec.lines.as_slice())
        {
            return Ok(stored);
        }
        return Err(DbError::Conflict("edit result ID refers to different data"));
    }
    let run: (String, String) = transaction.query_row(
        "SELECT translation_id, state FROM runs WHERE run_id = ?1",
        [base.run_id.to_string()],
        |row| Ok((row.get(0)?, row.get(1)?)),
    )?;
    if run.1 != "validated" {
        return Err(DbError::Conflict("edit base run is not validated"));
    }
    let latest: u32 = transaction.query_row(
        "SELECT MAX(revision) FROM results WHERE run_id = ?1",
        [base.run_id.to_string()],
        |row| row.get(0),
    )?;
    if latest != base.revision {
        return Err(DbError::Conflict("edit base result is stale"));
    }
    let previous_edit: Option<u32> = transaction.query_row(
        "SELECT MAX(revision) FROM segment_edits WHERE translation_id = ?1 AND segment_id = ?2",
        params![run.0, spec.segment_id.get()],
        |row| row.get(0),
    )?;
    let edit_revision = previous_edit
        .unwrap_or(0)
        .checked_add(1)
        .ok_or(DbError::InvalidSpec("segment edit revision exhausted"))?;
    transaction.execute(
        "INSERT INTO segment_edits (translation_id, segment_id, revision, text_lines_json, provenance)
         VALUES (?1, ?2, ?3, ?4, 'manual')",
        params![run.0, spec.segment_id.get(), edit_revision, serde_json::to_string(&spec.lines)?],
    )?;
    transaction.execute(
        "INSERT INTO results (result_id, run_id, revision, source_sha256, output_sha256,
            selected_segments_json, structural_evidence_json, review_state)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 'needs_review')",
        params![
            spec.result_id.to_string(),
            base.run_id.to_string(),
            next_revision,
            base.source_hash.to_string(),
            output_hash.to_string(),
            checkpoint_repository::encode_segments(&selected)?,
            evidence_json
        ],
    )?;
    transaction.execute(
        "INSERT INTO result_edit_selections (result_id, translation_id, segment_id, edit_revision)
         SELECT ?1, translation_id, segment_id, edit_revision FROM result_edit_selections
         WHERE result_id = ?2 AND segment_id != ?3",
        params![
            spec.result_id.to_string(),
            spec.base_result_id.to_string(),
            spec.segment_id.get()
        ],
    )?;
    transaction.execute(
        "INSERT INTO result_edit_selections (result_id, translation_id, segment_id, edit_revision)
         VALUES (?1, ?2, ?3, ?4)",
        params![
            spec.result_id.to_string(),
            run.0,
            spec.segment_id.get(),
            edit_revision
        ],
    )?;
    let stored = result_repository::load_from_connection(&transaction, spec.result_id)?;
    transaction.commit()?;
    Ok(stored)
}
