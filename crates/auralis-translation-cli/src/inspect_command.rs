use crate::read_source::read_source;
use auralis_translation_formats::inspect;
use std::error::Error;
use std::ffi::OsStr;
use std::path::Path;

pub(crate) fn run(path: &OsStr) -> Result<(), Box<dyn Error>> {
    let source = read_source(Path::new(path))?;
    let document = inspect(&source)?;
    println!("format=srt cues={}", document.segments().len());
    for segment in document.segments() {
        println!(
            "id={} label={} start_ms={} end_ms={}",
            segment.id, segment.cue_label, segment.start_ms, segment.end_ms
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
