use crate::{CheckpointSpec, DbError};
use auralis_translation::{RunId, SegmentId, SourceHash, TargetSegment};
use rusqlite::{Connection, OptionalExtension, params};
use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize)]
struct StoredSegment {
    id: u32,
    lines: Vec<String>,
}

pub(crate) fn commit(connection: &mut Connection, spec: &CheckpointSpec) -> Result<(), DbError> {
    if spec.attempt_count == 0 || spec.accepted.is_empty() {
        return Err(DbError::InvalidSpec(
            "checkpoint has no accepted work or attempts",
        ));
    }
    let diagnostics: serde_json::Value = serde_json::from_str(&spec.diagnostics_json)
        .map_err(|_| DbError::InvalidSpec("checkpoint diagnostics are invalid JSON"))?;
    if !diagnostics.is_array() {
        return Err(DbError::InvalidSpec(
            "checkpoint diagnostics must be an array",
        ));
    }
    let accepted_json = encode_segments(&spec.accepted)?;
    let run_id = spec.run_id.to_string();
    let transaction = connection.transaction()?;
    let run: Option<(String, String)> = transaction
        .query_row(
            "SELECT block_plan_json, state FROM runs WHERE run_id = ?1",
            [&run_id],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .optional()?;
    let (plan, state) = run.ok_or(DbError::Conflict("run does not exist"))?;
    let blocks: Vec<Vec<u32>> = serde_json::from_str(&plan)?;
    let expected = blocks
        .get(spec.block_index as usize)
        .ok_or(DbError::InvalidSpec(
            "checkpoint block is outside the run plan",
        ))?;
    if expected.as_slice()
        != spec
            .accepted
            .iter()
            .map(|segment| segment.id.get())
            .collect::<Vec<_>>()
    {
        return Err(DbError::InvalidSpec(
            "checkpoint IDs differ from the planned block",
        ));
    }
    if state != "running" {
        let exists: Option<u32> = transaction
            .query_row(
                "SELECT 1 FROM block_checkpoints WHERE run_id = ?1 AND block_index = ?2",
                params![run_id, spec.block_index],
                |row| row.get(0),
            )
            .optional()?;
        if exists.is_none() {
            return Err(DbError::Conflict("run is not running"));
        }
    }
    let fingerprint = spec.input_fingerprint.to_string();
    transaction.execute(
        "INSERT INTO block_checkpoints (run_id, block_index, input_fingerprint, accepted_json, diagnostics_json, attempt_count)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)
         ON CONFLICT(run_id, block_index) DO NOTHING",
        params![run_id, spec.block_index, fingerprint, accepted_json, spec.diagnostics_json, spec.attempt_count],
    )?;
    let stored: (String, String, String, u32) = transaction.query_row(
        "SELECT input_fingerprint, accepted_json, diagnostics_json, attempt_count
         FROM block_checkpoints WHERE run_id = ?1 AND block_index = ?2",
        params![run_id, spec.block_index],
        |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?)),
    )?;
    if stored
        != (
            fingerprint,
            accepted_json,
            spec.diagnostics_json.clone(),
            spec.attempt_count,
        )
    {
        return Err(DbError::Conflict("checkpoint differs from committed block"));
    }
    transaction.commit()?;
    Ok(())
}

pub(crate) fn load(connection: &Connection, run_id: RunId) -> Result<Vec<CheckpointSpec>, DbError> {
    let mut statement = connection.prepare(
        "SELECT block_index, input_fingerprint, accepted_json, diagnostics_json, attempt_count
         FROM block_checkpoints WHERE run_id = ?1 ORDER BY block_index",
    )?;
    let rows = statement.query_map([run_id.to_string()], |row| {
        Ok((
            row.get::<_, u32>(0)?,
            row.get::<_, String>(1)?,
            row.get::<_, String>(2)?,
            row.get::<_, String>(3)?,
            row.get::<_, u32>(4)?,
        ))
    })?;
    let mut checkpoints = Vec::new();
    for row in rows {
        let (block_index, fingerprint, accepted_json, diagnostics_json, attempt_count) = row?;
        let input_fingerprint = decode_hash(&fingerprint)?;
        let accepted = decode_segments(&accepted_json)?;
        checkpoints.push(CheckpointSpec {
            run_id,
            block_index,
            input_fingerprint,
            accepted,
            diagnostics_json,
            attempt_count,
        });
    }
    Ok(checkpoints)
}

pub(crate) fn encode_segments(segments: &[TargetSegment]) -> Result<String, DbError> {
    if segments.iter().any(|segment| {
        segment.lines.is_empty()
            || segment
                .lines
                .iter()
                .any(|line| line.is_empty() || line.chars().any(char::is_control))
    }) {
        return Err(DbError::InvalidSpec(
            "checkpoint contains invalid text lines",
        ));
    }
    let stored = segments
        .iter()
        .map(|segment| StoredSegment {
            id: segment.id.get(),
            lines: segment.lines.clone(),
        })
        .collect::<Vec<_>>();
    Ok(serde_json::to_string(&stored)?)
}

pub(crate) fn decode_segments(json: &str) -> Result<Vec<TargetSegment>, DbError> {
    let stored: Vec<StoredSegment> = serde_json::from_str(json)?;
    stored
        .into_iter()
        .map(|segment| {
            let id = SegmentId::new(segment.id).ok_or(DbError::CorruptRecord(
                "checkpoint contains zero segment ID",
            ))?;
            if segment.lines.is_empty()
                || segment
                    .lines
                    .iter()
                    .any(|line| line.is_empty() || line.chars().any(char::is_control))
            {
                return Err(DbError::CorruptRecord(
                    "checkpoint contains invalid text lines",
                ));
            }
            Ok(TargetSegment {
                id,
                lines: segment.lines,
            })
        })
        .collect()
}

pub(crate) fn decode_hash(hex: &str) -> Result<SourceHash, DbError> {
    if hex.len() != 64 {
        return Err(DbError::CorruptRecord("invalid checkpoint hash length"));
    }
    let mut bytes = [0_u8; 32];
    for (index, byte) in bytes.iter_mut().enumerate() {
        *byte = u8::from_str_radix(&hex[index * 2..index * 2 + 2], 16)
            .map_err(|_| DbError::CorruptRecord("invalid checkpoint hash"))?;
    }
    Ok(SourceHash::from_bytes(bytes))
}
