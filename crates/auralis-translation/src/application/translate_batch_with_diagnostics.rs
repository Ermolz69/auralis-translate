use super::{TranslateBatchError, validate_batch_response::validate_batch_response};
use crate::{
    ContractError, DiagnosticCode, RunControl, TargetSegment, TranslationBatch,
    TranslationDiagnostic, TranslationProvider, source_identifier_mismatch, source_identifiers,
};
use std::collections::HashSet;

pub(super) fn translate_batch_with_diagnostics(
    provider: &impl TranslationProvider,
    batch: &TranslationBatch,
    control: &dyn RunControl,
) -> Result<(Vec<TargetSegment>, Vec<TranslationDiagnostic>), TranslateBatchError> {
    let (response, mut diagnostics) = provider
        .translate_with_control_and_diagnostics(batch, control)
        .map_err(TranslateBatchError::Provider)?;
    let accepted = validate_batch_response(batch, response)?;
    let mut seen = HashSet::with_capacity(diagnostics.len());
    for diagnostic in &diagnostics {
        if diagnostic.code != DiagnosticCode::SourcePrefixInserted
            || !valid_source_prefix_diagnostic(batch, &accepted, diagnostic)
            || !seen.insert((diagnostic.segment_id, diagnostic.line_index))
        {
            return Err(invalid_diagnostics());
        }
    }
    diagnostics.sort_by_key(|diagnostic| (diagnostic.segment_id.get(), diagnostic.line_index));
    Ok((accepted, diagnostics))
}

pub(super) fn valid_source_prefix_diagnostic(
    batch: &TranslationBatch,
    accepted: &[TargetSegment],
    diagnostic: &TranslationDiagnostic,
) -> bool {
    let Some((source, target)) = batch
        .targets()
        .iter()
        .zip(accepted)
        .find(|(source, _)| source.id() == diagnostic.segment_id)
    else {
        return false;
    };
    let Ok(index) = usize::try_from(diagnostic.line_index) else {
        return false;
    };
    let (Some(source_line), Some(target_line)) =
        (source.lines().get(index), target.lines.get(index))
    else {
        return false;
    };
    !source_identifiers(source_line).is_empty()
        && !source_identifier_mismatch(source_line, target_line)
}

fn invalid_diagnostics() -> TranslateBatchError {
    TranslateBatchError::Contract(ContractError::ResponseDiagnostics)
}
