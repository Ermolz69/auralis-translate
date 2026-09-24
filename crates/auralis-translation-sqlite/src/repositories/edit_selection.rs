use crate::{DbError, EditSelection};
use auralis_translation::{ResultId, SegmentId};
use rusqlite::{Connection, OptionalExtension, params};

pub(crate) fn load(
    connection: &Connection,
    result_id: ResultId,
) -> Result<Vec<EditSelection>, DbError> {
    let mut statement = connection.prepare(
        "SELECT segment_id, edit_revision FROM result_edit_selections
         WHERE result_id = ?1 ORDER BY segment_id",
    )?;
    let rows = statement.query_map([result_id.to_string()], |row| {
        Ok((row.get::<_, u32>(0)?, row.get::<_, u32>(1)?))
    })?;
    rows.map(|row| {
        let (segment_id, revision) = row?;
        Ok(EditSelection {
            segment_id: SegmentId::new(segment_id)
                .ok_or(DbError::CorruptRecord("zero edit segment ID"))?,
            revision,
        })
    })
    .collect()
}

pub(crate) fn text(
    connection: &Connection,
    result_id: ResultId,
    segment_id: SegmentId,
) -> Result<Option<Vec<String>>, DbError> {
    let value: Option<String> = connection
        .query_row(
            "SELECT e.text_lines_json FROM result_edit_selections s
             JOIN segment_edits e ON e.translation_id = s.translation_id
              AND e.segment_id = s.segment_id AND e.revision = s.edit_revision
             WHERE s.result_id = ?1 AND s.segment_id = ?2",
            params![result_id.to_string(), segment_id.get()],
            |row| row.get(0),
        )
        .optional()?;
    value
        .map(|json| serde_json::from_str(&json).map_err(DbError::from))
        .transpose()
}
