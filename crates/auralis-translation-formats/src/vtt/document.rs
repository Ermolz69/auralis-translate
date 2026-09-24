use super::{SegmentTranslation, VttError, VttParsePolicy, VttSegment, parser, renderer, verifier};
use auralis_translation::{ContractError, SourceSegment};
use std::ops::Range;

#[derive(Clone, Debug)]
pub struct VttDocument {
    pub(crate) source: Vec<u8>,
    pub(crate) segments: Vec<VttSegment>,
    pub(crate) policy: VttParsePolicy,
}

impl VttDocument {
    pub fn parse(source: &[u8]) -> Result<Self, VttError> {
        Self::parse_with_policy(source, VttParsePolicy::default())
    }

    pub fn parse_with_policy(source: &[u8], policy: VttParsePolicy) -> Result<Self, VttError> {
        parser::parse(source, policy)
    }

    pub fn segments(&self) -> &[VttSegment] {
        &self.segments
    }
    pub fn source_bytes(&self) -> &[u8] {
        &self.source
    }

    pub fn source_segments(&self) -> Result<Vec<SourceSegment>, ContractError> {
        self.segments
            .iter()
            .map(|segment| {
                SourceSegment::new(
                    segment.id,
                    segment.start_ms,
                    segment.end_ms,
                    segment
                        .text_slots
                        .iter()
                        .map(|slot| slot.text.clone())
                        .collect(),
                )
            })
            .collect()
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

    pub fn render(&self, translations: &[SegmentTranslation]) -> Result<Vec<u8>, VttError> {
        let output = renderer::render(self, translations)?;
        let rendered = Self::parse_with_policy(&output, self.policy)?;
        verifier::verify(self, &rendered)?;
        Ok(output)
    }
}
