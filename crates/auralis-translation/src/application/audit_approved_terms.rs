use super::diagnose_batch::approved_term_missing;
use crate::{
    ApprovedTerms, ContractError, DiagnosticCode, SourceSegment, TargetSegment,
    TranslationDiagnostic,
};

pub fn audit_approved_terms(
    source: &[SourceSegment],
    accepted: &[TargetSegment],
    terms: &ApprovedTerms,
) -> Result<Vec<TranslationDiagnostic>, ContractError> {
    if source.len() != accepted.len() {
        return Err(ContractError::ResponseIds);
    }
    terms.validate_against(source)?;
    let mut warnings = Vec::new();
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
            if approved_term_missing(terms.entries(), original.id(), source_line, target_line) {
                warnings.push(TranslationDiagnostic {
                    code: DiagnosticCode::ApprovedTermMissing,
                    segment_id: original.id(),
                    line_index: u32::try_from(index).map_err(|_| ContractError::ResponseLines)?,
                });
            }
        }
    }
    Ok(warnings)
}
