use crate::{DbError, SegmentSpec};
use auralis_translation::{SegmentId, TranslationId};
use rusqlite::{Connection, OptionalExtension, params};
use std::collections::HashSet;

struct StoredSegmentRow {
    id: u32,
    ordinal: u32,
    cue_label: String,
    start_ms: i64,
    end_ms: i64,
    lines_json: String,
    ranges_json: String,
    parser_version: u32,
}

pub(crate) fn ensure(
    connection: &mut Connection,
    translation_id: TranslationId,
    source_len: u64,
    segments: &[SegmentSpec],
) -> Result<(), DbError> {
    validate(source_len, segments)?;
    let transaction = connection.transaction()?;
    let source_format: Option<String> = transaction
        .query_row(
            "SELECT source_format FROM translations WHERE translation_id = ?1",
            [translation_id.to_string()],
            |row| row.get(0),
        )
        .optional()?;
    let source_format = source_format.ok_or(DbError::Conflict("translation does not exist"))?;
    if source_format != "vtt" && segments.iter().any(|segment| segment.cue_label.is_none()) {
        return Err(DbError::InvalidSpec("missing source cue label"));
    }
    for segment in segments {
        let lines_json = serde_json::to_string(&segment.source_lines)?;
        let ranges_json = serde_json::to_string(
            &segment
                .text_ranges
                .iter()
                .map(|range| [range.start, range.end])
                .collect::<Vec<_>>(),
        )?;
        transaction.execute(
            "INSERT INTO segments (translation_id, segment_id, ordinal, cue_label, start_ms, end_ms, source_lines_json, source_map_json, parser_version)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
             ON CONFLICT(translation_id, segment_id) DO NOTHING",
            params![translation_id.to_string(), segment.id.get(), segment.ordinal,
                segment.cue_label.as_deref().unwrap_or(""), segment.start_ms as i64, segment.end_ms as i64,
                lines_json, ranges_json, segment.parser_version],
        )?;
    }
    if load(&transaction, translation_id)? != segments {
        return Err(DbError::Conflict(
            "stored source segments differ from extracted document",
        ));
    }
    transaction.commit()?;
    Ok(())
}

pub(crate) fn load(
    connection: &Connection,
    translation_id: TranslationId,
) -> Result<Vec<SegmentSpec>, DbError> {
    let mut statement = connection.prepare(
        "SELECT segment_id, ordinal, cue_label, start_ms, end_ms, source_lines_json, source_map_json, parser_version
         FROM segments WHERE translation_id = ?1 ORDER BY ordinal",
    )?;
    let rows = statement.query_map([translation_id.to_string()], |row| {
        Ok(StoredSegmentRow {
            id: row.get(0)?,
            ordinal: row.get(1)?,
            cue_label: row.get(2)?,
            start_ms: row.get(3)?,
            end_ms: row.get(4)?,
            lines_json: row.get(5)?,
            ranges_json: row.get(6)?,
            parser_version: row.get(7)?,
        })
    })?;
    let mut segments = Vec::new();
    for row in rows {
        let row = row?;
        let ranges: Vec<[u64; 2]> = serde_json::from_str(&row.ranges_json)?;
        segments.push(SegmentSpec {
            id: SegmentId::new(row.id).ok_or(DbError::CorruptRecord("zero stored segment ID"))?,
            ordinal: row.ordinal,
            cue_label: (!row.cue_label.is_empty()).then_some(row.cue_label),
            start_ms: u64::try_from(row.start_ms)
                .map_err(|_| DbError::CorruptRecord("negative stored start time"))?,
            end_ms: u64::try_from(row.end_ms)
                .map_err(|_| DbError::CorruptRecord("negative stored end time"))?,
            source_lines: serde_json::from_str(&row.lines_json)?,
            text_ranges: ranges.into_iter().map(|pair| pair[0]..pair[1]).collect(),
            parser_version: row.parser_version,
        });
    }
    Ok(segments)
}

fn validate(source_len: u64, segments: &[SegmentSpec]) -> Result<(), DbError> {
    if source_len == 0 || source_len > i64::MAX as u64 || segments.is_empty() {
        return Err(DbError::InvalidSpec(
            "invalid source size or empty segment set",
        ));
    }
    let mut ids = HashSet::new();
    let mut previous_end = 0;
    for (index, segment) in segments.iter().enumerate() {
        if Some(segment.ordinal) != u32::try_from(index).ok()
            || !ids.insert(segment.id)
            || segment
                .cue_label
                .as_ref()
                .is_some_and(|label| label.is_empty() || label.chars().any(char::is_control))
            || segment.start_ms >= segment.end_ms
            || segment.end_ms > i64::MAX as u64
            || segment.parser_version == 0
            || segment.source_lines.is_empty()
            || segment.source_lines.len() != segment.text_ranges.len()
        {
            return Err(DbError::InvalidSpec("invalid source segment metadata"));
        }
        for (line, range) in segment.source_lines.iter().zip(&segment.text_ranges) {
            if line.is_empty()
                || line.chars().any(char::is_control)
                || range.start < previous_end
                || range.start >= range.end
                || range.end > source_len
                || range.end - range.start != line.len() as u64
            {
                return Err(DbError::InvalidSpec("invalid source text range"));
            }
            previous_end = range.end;
        }
    }
    Ok(())
}
