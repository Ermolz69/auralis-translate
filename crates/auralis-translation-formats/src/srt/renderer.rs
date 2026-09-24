use super::{SegmentTranslation, SrtDocument, SrtError, SrtErrorCode, parser};
use std::collections::BTreeMap;

pub(crate) fn render(
    document: &SrtDocument,
    translations: &[SegmentTranslation],
) -> Result<Vec<u8>, SrtError> {
    let by_id: BTreeMap<_, _> = translations.iter().map(|item| (item.id, item)).collect();
    if translations.len() != document.segments.len() || by_id.len() != translations.len() {
        return Err(SrtError::document(SrtErrorCode::TranslationIds));
    }

    let mut output = Vec::with_capacity(document.source.len());
    let mut cursor = 0;
    for segment in &document.segments {
        let translated = by_id
            .get(&segment.id)
            .ok_or_else(|| SrtError::document(SrtErrorCode::TranslationIds))?;
        if translated.lines.len() != segment.text_slots.len() {
            return Err(SrtError::document(SrtErrorCode::TranslationLines));
        }
        for (slot, text) in segment.text_slots.iter().zip(&translated.lines) {
            parser::validate_text(text).map_err(SrtError::document)?;
            output.extend_from_slice(&document.source[cursor..slot.byte_range.start]);
            output.extend_from_slice(text.as_bytes());
            cursor = slot.byte_range.end;
        }
    }
    output.extend_from_slice(&document.source[cursor..]);
    Ok(output)
}
