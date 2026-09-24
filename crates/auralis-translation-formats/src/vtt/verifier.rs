use super::{VttDocument, VttError, VttErrorCode};

pub(crate) fn verify(original: &VttDocument, rendered: &VttDocument) -> Result<(), VttError> {
    if original.segments.len() != rendered.segments.len() {
        return Err(VttError::document(VttErrorCode::StructuralMismatch));
    }
    for (source, output) in original.segments.iter().zip(&rendered.segments) {
        if source.id != output.id
            || source.cue_id != output.cue_id
            || source.start_ms != output.start_ms
            || source.end_ms != output.end_ms
            || source.text_slots.len() != output.text_slots.len()
        {
            return Err(VttError::document(VttErrorCode::StructuralMismatch));
        }
    }
    let source_chunks = original.protected_byte_ranges();
    let output_chunks = rendered.protected_byte_ranges();
    if source_chunks.len() != output_chunks.len()
        || source_chunks
            .iter()
            .zip(output_chunks)
            .any(|(source, output)| original.source[source.clone()] != rendered.source[output])
    {
        return Err(VttError::document(VttErrorCode::StructuralMismatch));
    }
    Ok(())
}
