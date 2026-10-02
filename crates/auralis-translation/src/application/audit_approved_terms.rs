use super::diagnose_batch::missing_form;
use crate::{ApprovedTerms, ContractError, SegmentId, SourceSegment, TargetSegment};

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MissingApprovedTerm {
    pub segment_id: SegmentId,
    pub line_index: u32,
    pub term_index: usize,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ApprovedTermAudit {
    pub checked_term_pairs: usize,
    pub warnings: Vec<MissingApprovedTerm>,
}

pub fn audit_approved_terms(
    source: &[SourceSegment],
    accepted: &[TargetSegment],
    terms: &ApprovedTerms,
) -> Result<ApprovedTermAudit, ContractError> {
    if source.len() != accepted.len() {
        return Err(ContractError::ResponseIds);
    }
    terms.validate_against(source)?;
    let mut warnings = Vec::new();
    let mut checked_term_pairs = 0;
    for (original, translated) in source.iter().zip(accepted) {
        if original.id() != translated.id {
            return Err(ContractError::ResponseIds);
        }
        if original.lines().len() != translated.lines.len() {
            return Err(ContractError::ResponseLines);
        }
        for (index, (source_line, target_line)) in
            original.lines().iter().zip(&translated.lines).enumerate()
        {
            let translated_lowercase = target_line.to_lowercase();
            for (term_index, term) in terms.entries().iter().enumerate() {
                if !term.segment_ids().contains(&original.id())
                    || !source_line.contains(term.source())
                {
                    continue;
                }
                checked_term_pairs += 1;
                if missing_form(&translated_lowercase, term.target(), term.allowed_forms()) {
                    warnings.push(MissingApprovedTerm {
                        segment_id: original.id(),
                        line_index: u32::try_from(index)
                            .map_err(|_| ContractError::ResponseLines)?,
                        term_index,
                    });
                }
            }
        }
    }
    Ok(ApprovedTermAudit {
        checked_term_pairs,
        warnings,
    })
}
