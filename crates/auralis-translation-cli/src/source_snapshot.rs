use auralis_translation_formats::srt::SrtRunPlan;
use auralis_translation_sqlite::SegmentSpec;
use std::error::Error;

pub(crate) fn source_snapshot(plan: &SrtRunPlan) -> Result<Vec<SegmentSpec>, Box<dyn Error>> {
    let mut specs = Vec::with_capacity(plan.source_segments().len());
    for (ordinal, segment) in plan.source_segments().iter().enumerate() {
        let text_ranges = segment
            .text_slots
            .iter()
            .map(|slot| {
                Ok(u64::try_from(slot.byte_range.start)?..u64::try_from(slot.byte_range.end)?)
            })
            .collect::<Result<Vec<_>, std::num::TryFromIntError>>()?;
        specs.push(SegmentSpec {
            id: segment.id,
            ordinal: u32::try_from(ordinal)?,
            cue_label: Some(segment.cue_label.clone()),
            start_ms: segment.start_ms,
            end_ms: segment.end_ms,
            source_lines: segment
                .text_slots
                .iter()
                .map(|slot| slot.text.clone())
                .collect(),
            text_ranges,
            parser_version: SrtRunPlan::PARSER_VERSION,
        });
    }
    Ok(specs)
}
