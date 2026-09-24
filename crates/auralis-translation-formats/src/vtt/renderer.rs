use super::{SegmentTranslation, VttDocument, VttError, VttErrorCode, text};
use std::collections::BTreeMap;

pub(crate) fn render(
    document: &VttDocument,
    translations: &[SegmentTranslation],
) -> Result<Vec<u8>, VttError> {
    let by_id: BTreeMap<_, _> = translations.iter().map(|item| (item.id, item)).collect();
    if translations.len() != document.segments.len() || by_id.len() != translations.len() {
        return Err(VttError::document(VttErrorCode::TranslationIds));
    }
    let mut output = Vec::with_capacity(document.source.len());
    let mut cursor = 0;
    for segment in &document.segments {
        let translated = by_id
            .get(&segment.id)
            .ok_or_else(|| VttError::document(VttErrorCode::TranslationIds))?;
        if translated.lines.len() != segment.text_slots.len() {
            return Err(VttError::document(VttErrorCode::TranslationLines));
        }
        for (slot, line) in segment.text_slots.iter().zip(&translated.lines) {
            text::validate(line).map_err(VttError::document)?;
            output.extend_from_slice(&document.source[cursor..slot.byte_range.start]);
            output.extend_from_slice(line.as_bytes());
            cursor = slot.byte_range.end;
        }
    }
    output.extend_from_slice(&document.source[cursor..]);
    Ok(output)
}
