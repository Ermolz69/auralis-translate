use super::{SegmentTranslation, SrtError, SrtSegment, parser, renderer, verifier};
use std::ops::Range;

#[derive(Clone, Debug)]
pub struct SrtDocument {
    pub(crate) source: Vec<u8>,
    pub(crate) segments: Vec<SrtSegment>,
}

impl SrtDocument {
    pub fn parse(source: &[u8]) -> Result<Self, SrtError> {
        parser::parse(source)
    }

    pub fn segments(&self) -> &[SrtSegment] {
        &self.segments
    }

    pub fn source_bytes(&self) -> &[u8] {
        &self.source
    }

    pub fn protected_byte_ranges(&self) -> Vec<Range<usize>> {
        let mut ranges = Vec::new();
        let mut cursor = 0;
        for slot in self.segments.iter().flat_map(|segment| &segment.text_slots) {
            ranges.push(cursor..slot.byte_range.start);
            cursor = slot.byte_range.end;
        }
        ranges.push(cursor..self.source.len());
        ranges
    }

    pub fn original_translations(&self) -> Vec<SegmentTranslation> {
        self.segments
            .iter()
            .map(|segment| SegmentTranslation {
                id: segment.id,
                lines: segment
                    .text_slots
                    .iter()
                    .map(|slot| slot.text.clone())
                    .collect(),
            })
            .collect()
    }

    pub fn render(&self, translations: &[SegmentTranslation]) -> Result<Vec<u8>, SrtError> {
        let output = renderer::render(self, translations)?;
        let rendered = Self::parse(&output)?;
        verifier::verify(self, &rendered)?;
        Ok(output)
    }
}
