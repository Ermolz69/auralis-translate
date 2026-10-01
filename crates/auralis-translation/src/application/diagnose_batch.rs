use super::capacity_mismatch::source_capacity_mismatch;
use super::identifier_mismatch::source_identifier_mismatch;
use super::measurement_mismatch::source_measurement_mismatch;
use super::time_mismatch::source_time_mismatch;
use crate::{DiagnosticCode, TargetSegment, TranslationBatch, TranslationDiagnostic};

pub(crate) fn diagnose_batch(
    batch: &TranslationBatch,
    accepted: &[TargetSegment],
) -> Vec<TranslationDiagnostic> {
    let mut diagnostics = Vec::new();
    for (source, translated) in batch.targets().iter().zip(accepted) {
        for (index, (source_line, translated_line)) in
            source.lines().iter().zip(&translated.lines).enumerate()
        {
            let Ok(line_index) = u32::try_from(index) else {
                continue;
            };
            if source_line == translated_line {
                diagnostics.push(TranslationDiagnostic {
                    code: DiagnosticCode::UnchangedSource,
                    segment_id: source.id(),
                    line_index,
                });
            }
            if translated_line.chars().any(char::is_alphabetic)
                && !translated_line.chars().any(is_cyrillic)
            {
                diagnostics.push(TranslationDiagnostic {
                    code: DiagnosticCode::NoCyrillic,
                    segment_id: source.id(),
                    line_index,
                });
            }
            if glossary_term_missing(batch, source.id(), source_line, translated_line) {
                diagnostics.push(TranslationDiagnostic {
                    code: DiagnosticCode::GlossaryTermMissing,
                    segment_id: source.id(),
                    line_index,
                });
            }
            if approved_term_missing(batch, source.id(), source_line, translated_line) {
                diagnostics.push(TranslationDiagnostic {
                    code: DiagnosticCode::ApprovedTermMissing,
                    segment_id: source.id(),
                    line_index,
                });
            }
            if source_identifier_mismatch(source_line, translated_line) {
                diagnostics.push(TranslationDiagnostic {
                    code: DiagnosticCode::IdentifierMismatch,
                    segment_id: source.id(),
                    line_index,
                });
            }
            if source_time_mismatch(source_line, translated_line) {
                diagnostics.push(TranslationDiagnostic {
                    code: DiagnosticCode::TimeMismatch,
                    segment_id: source.id(),
                    line_index,
                });
            }
            if source_measurement_mismatch(source_line, translated_line) {
                diagnostics.push(TranslationDiagnostic {
                    code: DiagnosticCode::MeasurementMismatch,
                    segment_id: source.id(),
                    line_index,
                });
            }
            if source_capacity_mismatch(source_line, translated_line) {
                diagnostics.push(TranslationDiagnostic {
                    code: DiagnosticCode::CapacityMismatch,
                    segment_id: source.id(),
                    line_index,
                });
            }
        }
    }
    diagnostics
}

fn glossary_term_missing(
    batch: &TranslationBatch,
    segment_id: crate::SegmentId,
    source_line: &str,
    translated_line: &str,
) -> bool {
    let translated = translated_line.to_lowercase();
    batch.glossary().iter().any(|entry| {
        entry
            .segment_ids()
            .is_none_or(|scope| scope.contains(&segment_id))
            && source_line.contains(entry.source())
            && missing_form(&translated, entry.target(), entry.allowed_forms())
    })
}

fn approved_term_missing(
    batch: &TranslationBatch,
    segment_id: crate::SegmentId,
    source_line: &str,
    translated_line: &str,
) -> bool {
    let translated = translated_line.to_lowercase();
    batch.approved_terms().iter().any(|entry| {
        entry.segment_ids().contains(&segment_id)
            && source_line.contains(entry.source())
            && missing_form(&translated, entry.target(), entry.allowed_forms())
    })
}

fn missing_form(translated: &str, target: &str, allowed_forms: &[String]) -> bool {
    !translated.contains(&target.to_lowercase())
        && !allowed_forms
            .iter()
            .any(|form| translated.contains(&form.to_lowercase()))
}

fn is_cyrillic(character: char) -> bool {
    ('\u{0400}'..='\u{052f}').contains(&character)
}
