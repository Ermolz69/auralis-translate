use super::{SrtDocument, SrtError, SrtErrorCode};

pub(crate) fn verify(original: &SrtDocument, rendered: &SrtDocument) -> Result<(), SrtError> {
    if original.segments.len() != rendered.segments.len() {
        return Err(SrtError::document(SrtErrorCode::StructuralMismatch));
    }
    for (source, output) in original.segments.iter().zip(&rendered.segments) {
        if source.id != output.id
            || source.cue_label != output.cue_label
            || source.start_ms != output.start_ms
            || source.end_ms != output.end_ms
            || source.text_slots.len() != output.text_slots.len()
        {
            return Err(SrtError::document(SrtErrorCode::StructuralMismatch));
        }
    }
    if protected_chunks(original) != protected_chunks(rendered) {
        return Err(SrtError::document(SrtErrorCode::StructuralMismatch));
    }
    Ok(())
}

fn protected_chunks(document: &SrtDocument) -> Vec<&[u8]> {
    document
        .protected_byte_ranges()
        .into_iter()
        .map(|range| &document.source[range])
        .collect()
}
