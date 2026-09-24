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
        }
    }
    diagnostics
}

fn is_cyrillic(character: char) -> bool {
    ('\u{0400}'..='\u{052f}').contains(&character)
}
