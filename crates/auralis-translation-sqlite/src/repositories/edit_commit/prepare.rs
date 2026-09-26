use super::prepared_edit::PreparedEdit;
use crate::{DbError, EditSpec, ResultRecord};
use auralis_translation::{SourceHash, VerifiedRenderer};

pub(super) fn run<V: VerifiedRenderer>(
    spec: &EditSpec,
    base: &ResultRecord,
    renderer: &V,
) -> Result<PreparedEdit, DbError> {
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
    Ok(PreparedEdit {
        selected,
        output_hash: SourceHash::digest(&output),
        evidence_json: evidence_json.to_owned(),
    })
}
