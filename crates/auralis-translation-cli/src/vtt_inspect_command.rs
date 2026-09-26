use crate::read_source::read_bounded;
use auralis_translation_formats::vtt::{VttDocument, VttParsePolicy};
use std::error::Error;
use std::ffi::OsStr;
use std::path::Path;

pub(crate) fn run(
    path: &OsStr,
    reporter: &mut crate::reporting::CommandOutput,
) -> Result<(), Box<dyn Error>> {
    let source = read_bounded(
        Path::new(path),
        VttParsePolicy::default().max_bytes(),
        "source",
    )?;
    let document = VttDocument::parse(&source)?;
    if reporter.is_machine() {
        return reporter.report("inspect-vtt", &serde_json::json!({
            "format": "vtt", "source_sha256": auralis_translation::SourceHash::digest(&source).to_string(),
            "segments": document.segments().iter().map(|segment| serde_json::json!({
                "id": segment.id.get(), "cue_id": segment.cue_id,
                "start_ms": segment.start_ms, "end_ms": segment.end_ms,
                "text_slots": segment.text_slots.iter().map(|slot| serde_json::json!({"start": slot.byte_range.start, "end": slot.byte_range.end, "text": slot.text})).collect::<Vec<_>>()
            })).collect::<Vec<_>>(),
            "protected_ranges": document.protected_byte_ranges().iter().map(|range| serde_json::json!({"start": range.start, "end": range.end})).collect::<Vec<_>>()
        }));
    }
    println!("format=vtt cues={}", document.segments().len());
    for segment in document.segments() {
        println!(
            "id={} cue_id={} start_ms={} end_ms={}",
            segment.id,
            segment.cue_id.as_deref().unwrap_or(""),
            segment.start_ms,
            segment.end_ms
        );
        for slot in &segment.text_slots {
            println!(
                "  bytes={}..{} text={}",
                slot.byte_range.start, slot.byte_range.end, slot.text
            );
        }
    }
    for range in document.protected_byte_ranges() {
        println!("protected_bytes={}..{}", range.start, range.end);
    }
    Ok(())
}
