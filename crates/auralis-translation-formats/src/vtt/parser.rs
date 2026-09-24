use super::lines::{Line, scan};
use super::{
    TextSlot, VttDocument, VttError, VttErrorCode, VttParsePolicy, VttSegment, text, timing,
};
use auralis_translation::SegmentId;
use std::collections::HashSet;

const HEADER: &str = "WEBVTT";

pub(crate) fn parse(source: &[u8], policy: VttParsePolicy) -> Result<VttDocument, VttError> {
    let lines = scan(source, policy)?;
    let first = lines
        .first()
        .ok_or_else(|| VttError::document(VttErrorCode::InvalidHeader))?;
    if first.text.strip_prefix('\u{feff}').unwrap_or(first.text) != HEADER {
        return Err(VttError::at(VttErrorCode::InvalidHeader, first.number));
    }
    if !lines.get(1).is_some_and(|line| line.text.is_empty()) {
        return Err(VttError::at(VttErrorCode::MissingHeaderSeparator, 2));
    }
    let mut cursor = 2;
    let mut segments = Vec::new();
    let mut cue_ids = HashSet::new();
    while cursor < lines.len() {
        if lines[cursor].text.is_empty() {
            cursor += 1;
            continue;
        }
        let line = &lines[cursor];
        if is_note(line.text) {
            cursor = skip_note(&lines, cursor)?;
            continue;
        }
        if matches!(line.text, "STYLE" | "REGION") {
            return Err(VttError::at(VttErrorCode::UnsupportedFeature, line.number));
        }
        if segments.len() >= policy.max_cues() as usize {
            return Err(VttError::document(VttErrorCode::TooManyCues));
        }
        let (cue_id, timing_line) =
            if timing::parse(line.text).is_some() || line.text.contains("-->") {
                (None, line)
            } else {
                validate_cue_id(line.text).map_err(|code| VttError::at(code, line.number))?;
                cursor += 1;
                let timing_line = lines
                    .get(cursor)
                    .ok_or_else(|| VttError::at(VttErrorCode::InvalidTiming, line.number + 1))?;
                (Some(line.text.to_owned()), timing_line)
            };
        let (start_ms, end_ms) = timing::parse(timing_line.text)
            .ok_or_else(|| VttError::at(VttErrorCode::InvalidTiming, timing_line.number))?;
        if segments
            .last()
            .is_some_and(|last: &VttSegment| start_ms < last.start_ms)
        {
            return Err(VttError::at(
                VttErrorCode::UnorderedTiming,
                timing_line.number,
            ));
        }
        if cue_id
            .as_ref()
            .is_some_and(|id| !cue_ids.insert(id.clone()))
        {
            return Err(VttError::at(VttErrorCode::DuplicateCueId, line.number));
        }
        cursor += 1;
        let text_slots = parse_text_slots(&lines, &mut cursor)?;
        if text_slots.is_empty() {
            return Err(VttError::at(
                VttErrorCode::MissingText,
                timing_line.number + 1,
            ));
        }
        let id = u32::try_from(segments.len() + 1)
            .ok()
            .and_then(SegmentId::new)
            .ok_or_else(|| VttError::document(VttErrorCode::TooManyCues))?;
        segments.push(VttSegment {
            id,
            cue_id,
            start_ms,
            end_ms,
            text_slots,
        });
    }
    if segments.is_empty() {
        return Err(VttError::document(VttErrorCode::MissingText));
    }
    Ok(VttDocument {
        source: source.to_vec(),
        segments,
        policy,
    })
}

fn parse_text_slots(lines: &[Line<'_>], cursor: &mut usize) -> Result<Vec<TextSlot>, VttError> {
    let mut slots = Vec::new();
    while let Some(line) = lines.get(*cursor) {
        if line.text.is_empty() {
            break;
        }
        if timing::parse(line.text).is_some() {
            return Err(VttError::at(VttErrorCode::MissingSeparator, line.number));
        }
        text::validate(line.text).map_err(|code| VttError::at(code, line.number))?;
        slots.push(TextSlot {
            text: line.text.to_owned(),
            byte_range: line.start..line.end,
        });
        *cursor += 1;
    }
    Ok(slots)
}

fn is_note(text: &str) -> bool {
    text == "NOTE" || text.starts_with("NOTE ") || text.starts_with("NOTE\t")
}

fn skip_note(lines: &[Line<'_>], mut cursor: usize) -> Result<usize, VttError> {
    validate_note_line(&lines[cursor])?;
    cursor += 1;
    while let Some(line) = lines.get(cursor) {
        if line.text.is_empty() {
            break;
        }
        validate_note_line(line)?;
        if timing::parse(line.text).is_some() {
            return Err(VttError::at(VttErrorCode::MissingSeparator, line.number));
        }
        cursor += 1;
    }
    Ok(cursor)
}

fn validate_note_line(line: &Line<'_>) -> Result<(), VttError> {
    if line.text.contains('\u{feff}')
        || line
            .text
            .chars()
            .any(|character| character.is_control() && character != '\t')
    {
        return Err(VttError::at(VttErrorCode::UnsupportedControl, line.number));
    }
    Ok(())
}

fn validate_cue_id(text: &str) -> Result<(), VttErrorCode> {
    if text.is_empty() || text.contains("-->") || text.contains('\u{feff}') {
        return Err(VttErrorCode::InvalidCueId);
    }
    if text.chars().any(char::is_control) {
        return Err(VttErrorCode::UnsupportedControl);
    }
    Ok(())
}
