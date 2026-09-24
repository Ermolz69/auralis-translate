use crate::document_run_plan::DocumentRunPlan;
use auralis_translation_formats::srt::TextSlot;
use auralis_translation_sqlite::SegmentSpec;
use std::error::Error;

pub(crate) fn source_snapshot(plan: &DocumentRunPlan) -> Result<Vec<SegmentSpec>, Box<dyn Error>> {
    match plan {
        DocumentRunPlan::Srt(plan) => plan
            .source_segments()
            .iter()
            .enumerate()
            .map(|(ordinal, segment)| {
                snapshot_segment(
                    segment.id,
                    ordinal,
                    Some(segment.cue_label.clone()),
                    segment.start_ms,
                    segment.end_ms,
                    &segment.text_slots,
                    auralis_translation_formats::srt::SrtRunPlan::PARSER_VERSION,
                )
            })
            .collect(),
        DocumentRunPlan::Vtt(plan) => plan
            .source_segments()
            .iter()
            .enumerate()
            .map(|(ordinal, segment)| {
                snapshot_segment(
                    segment.id,
                    ordinal,
                    segment.cue_id.clone(),
                    segment.start_ms,
                    segment.end_ms,
                    &segment.text_slots,
                    auralis_translation_formats::vtt::VttRunPlan::PARSER_VERSION,
                )
            })
            .collect(),
    }
}

fn snapshot_segment(
    id: auralis_translation::SegmentId,
    ordinal: usize,
    cue_label: Option<String>,
    start_ms: u64,
    end_ms: u64,
    text_slots: &[TextSlot],
    parser_version: u32,
) -> Result<SegmentSpec, Box<dyn Error>> {
    let text_ranges = text_slots
        .iter()
        .map(|slot| Ok(u64::try_from(slot.byte_range.start)?..u64::try_from(slot.byte_range.end)?))
        .collect::<Result<Vec<_>, std::num::TryFromIntError>>()?;
    Ok(SegmentSpec {
        id,
        ordinal: u32::try_from(ordinal)?,
        cue_label,
        start_ms,
        end_ms,
        source_lines: text_slots.iter().map(|slot| slot.text.clone()).collect(),
        text_ranges,
        parser_version,
    })
}
