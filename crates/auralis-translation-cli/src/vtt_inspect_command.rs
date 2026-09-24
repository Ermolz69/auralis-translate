use crate::read_source::read_bounded;
use auralis_translation_formats::vtt::{VttDocument, VttParsePolicy};
use std::error::Error;
use std::ffi::OsStr;
use std::path::Path;

pub(crate) fn run(path: &OsStr) -> Result<(), Box<dyn Error>> {
    let source = read_bounded(
        Path::new(path),
        VttParsePolicy::default().max_bytes(),
        "source",
    )?;
    let document = VttDocument::parse(&source)?;
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
