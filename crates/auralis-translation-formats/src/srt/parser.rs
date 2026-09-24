use super::{SrtDocument, SrtError, SrtErrorCode, SrtSegment, TextSlot};
use auralis_translation::SegmentId;

const TIMING_SEPARATOR: &str = " --> ";
const TIMESTAMP_LENGTH: usize = 12;

struct Line<'a> {
    text: &'a str,
    start: usize,
    end: usize,
    number: usize,
}

pub(crate) fn parse(source: &[u8]) -> Result<SrtDocument, SrtError> {
    std::str::from_utf8(source).map_err(|_| SrtError::document(SrtErrorCode::InvalidUtf8))?;
    let lines = scan_lines(source)?;
    let mut cursor = 0;
    let mut segments = Vec::new();

    while cursor < lines.len() {
        let label_line = &lines[cursor];
        let label = if cursor == 0 {
            label_line
                .text
                .strip_prefix('\u{feff}')
                .unwrap_or(label_line.text)
        } else {
            label_line.text
        };
        if label.is_empty() || !label.bytes().all(|byte| byte.is_ascii_digit()) {
            return Err(SrtError::at(
                SrtErrorCode::InvalidCueLabel,
                label_line.number,
            ));
        }

        cursor += 1;
        let timing_line = lines
            .get(cursor)
            .ok_or_else(|| SrtError::at(SrtErrorCode::InvalidTiming, label_line.number + 1))?;
        let (start_ms, end_ms) = parse_timing(timing_line.text)
            .ok_or_else(|| SrtError::at(SrtErrorCode::InvalidTiming, timing_line.number))?;
        cursor += 1;

        let mut text_slots = Vec::new();
        while let Some(line) = lines.get(cursor) {
            if line.text.is_empty() {
                break;
            }
            if line.text.bytes().all(|byte| byte.is_ascii_digit())
                && lines
                    .get(cursor + 1)
                    .is_some_and(|next| parse_timing(next.text).is_some())
            {
                return Err(SrtError::at(SrtErrorCode::MissingSeparator, line.number));
            }
            validate_text(line.text).map_err(|code| SrtError::at(code, line.number))?;
            text_slots.push(TextSlot {
                text: line.text.to_owned(),
                byte_range: line.start..line.end,
            });
            cursor += 1;
        }
        if text_slots.is_empty() {
            return Err(SrtError::at(
                SrtErrorCode::MissingText,
                timing_line.number + 1,
            ));
        }

        let next_id = u32::try_from(segments.len() + 1)
            .ok()
            .and_then(SegmentId::new)
            .ok_or_else(|| SrtError::document(SrtErrorCode::TooManyCues))?;
        segments.push(SrtSegment {
            id: next_id,
            cue_label: label.to_owned(),
            start_ms,
            end_ms,
            text_slots,
        });

        while lines.get(cursor).is_some_and(|line| line.text.is_empty()) {
            cursor += 1;
        }
    }

    if segments.is_empty() {
        return Err(SrtError::document(SrtErrorCode::InvalidCueLabel));
    }
    Ok(SrtDocument {
        source: source.to_vec(),
        segments,
    })
}

pub(crate) fn validate_text(text: &str) -> Result<(), SrtErrorCode> {
    if text.is_empty() || text.contains('\n') || text.contains('\r') {
        return Err(SrtErrorCode::TranslationLines);
    }
    if text.chars().any(|character| "<>{}".contains(character)) {
        return Err(SrtErrorCode::UnsupportedMarkup);
    }
    if text.chars().any(char::is_control) || text.contains('\u{feff}') {
        return Err(SrtErrorCode::UnsupportedControl);
    }
    Ok(())
}

fn scan_lines(source: &[u8]) -> Result<Vec<Line<'_>>, SrtError> {
    let mut result = Vec::new();
    let mut start = 0;
    let mut expected_ending = None;

    for (index, byte) in source.iter().enumerate() {
        if *byte != b'\n' {
            continue;
        }
        let crlf = index > start && source[index - 1] == b'\r';
        if expected_ending.is_some_and(|expected| expected != crlf) {
            return Err(SrtError::at(
                SrtErrorCode::InvalidLineEnding,
                result.len() + 1,
            ));
        }
        expected_ending = Some(crlf);
        let end = if crlf { index - 1 } else { index };
        result.push(make_line(source, start, end, result.len() + 1)?);
        start = index + 1;
    }
    if start < source.len() {
        result.push(make_line(source, start, source.len(), result.len() + 1)?);
    }
    Ok(result)
}

fn make_line(source: &[u8], start: usize, end: usize, number: usize) -> Result<Line<'_>, SrtError> {
    let text = std::str::from_utf8(&source[start..end])
        .map_err(|_| SrtError::at(SrtErrorCode::InvalidUtf8, number))?;
    if text.contains('\r') {
        return Err(SrtError::at(SrtErrorCode::InvalidLineEnding, number));
    }
    Ok(Line {
        text,
        start,
        end,
        number,
    })
}

fn parse_timing(text: &str) -> Option<(u64, u64)> {
    let (start, end) = text.split_once(TIMING_SEPARATOR)?;
    let start_ms = parse_timestamp(start)?;
    let end_ms = parse_timestamp(end)?;
    (start_ms < end_ms).then_some((start_ms, end_ms))
}

fn parse_timestamp(text: &str) -> Option<u64> {
    let bytes = text.as_bytes();
    if bytes.len() != TIMESTAMP_LENGTH
        || bytes[2] != b':'
        || bytes[5] != b':'
        || bytes[8] != b','
        || !bytes
            .iter()
            .enumerate()
            .filter(|(index, _)| ![2, 5, 8].contains(index))
            .all(|(_, byte)| byte.is_ascii_digit())
    {
        return None;
    }
    let hours = text[0..2].parse::<u64>().ok()?;
    let minutes = text[3..5].parse::<u64>().ok()?;
    let seconds = text[6..8].parse::<u64>().ok()?;
    let milliseconds = text[9..12].parse::<u64>().ok()?;
    if minutes >= 60 || seconds >= 60 {
        return None;
    }
    Some((((hours * 60 + minutes) * 60 + seconds) * 1000) + milliseconds)
}
