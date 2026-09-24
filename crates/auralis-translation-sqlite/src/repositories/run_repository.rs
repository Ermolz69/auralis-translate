use crate::{DbError, RunSpec};
use auralis_translation::{RunId, SegmentId, SourceHash, TranslationId};
use rusqlite::{Connection, OptionalExtension, params};
use std::collections::HashSet;

struct StoredRunRow {
    translation: String,
    hash: String,
    profile: String,
    parser: u32,
    policy: String,
    glossary: Option<String>,
    plan: String,
}

pub(crate) fn ensure(connection: &mut Connection, spec: &RunSpec) -> Result<(), DbError> {
    if spec.profile_fingerprint.is_empty()
        || spec.policy_fingerprint.is_empty()
        || spec.parser_version == 0
        || spec.blocks.is_empty()
        || spec.blocks.iter().any(Vec::is_empty)
    {
        return Err(DbError::InvalidSpec(
            "incomplete run fingerprint or block plan",
        ));
    }
    let mut segment_ids = HashSet::new();
    if spec
        .blocks
        .iter()
        .flatten()
        .any(|id| !segment_ids.insert(*id))
    {
        return Err(DbError::InvalidSpec("block plan repeats a target segment"));
    }
    let block_plan_json = serde_json::to_string(
        &spec
            .blocks
            .iter()
            .map(|block| block.iter().map(|id| id.get()).collect::<Vec<_>>())
            .collect::<Vec<_>>(),
    )?;
    let source_hash = spec.source_hash.to_string();
    let transaction = connection.transaction()?;
    let translation_hash: Option<String> = transaction
        .query_row(
            "SELECT source_sha256 FROM translations WHERE translation_id = ?1",
            [spec.translation_id.to_string()],
            |row| row.get(0),
        )
        .optional()?;
    if translation_hash.as_deref() != Some(source_hash.as_str()) {
        return Err(DbError::Conflict(
            "run source does not match translation source",
        ));
    }
    transaction.execute(
        "INSERT INTO runs (run_id, translation_id, state, source_sha256, profile_fingerprint, parser_version, policy_fingerprint, glossary_revision, block_plan_json)
         VALUES (?1, ?2, 'requested', ?3, ?4, ?5, ?6, ?7, ?8)
         ON CONFLICT(run_id) DO NOTHING",
        params![
            spec.run_id.to_string(),
            spec.translation_id.to_string(),
            source_hash,
            spec.profile_fingerprint,
            spec.parser_version,
            spec.policy_fingerprint,
            spec.glossary_revision,
            block_plan_json,
        ],
    )?;
    let stored: (String, String, String, u32, String, Option<String>, String) =
        transaction.query_row(
            "SELECT translation_id, source_sha256, profile_fingerprint, parser_version, policy_fingerprint, glossary_revision, block_plan_json
             FROM runs WHERE run_id = ?1",
            [spec.run_id.to_string()],
            |row| {
                Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?, row.get(4)?, row.get(5)?, row.get(6)?))
            },
        )?;
    if stored
        != (
            spec.translation_id.to_string(),
            source_hash,
            spec.profile_fingerprint.clone(),
            spec.parser_version,
            spec.policy_fingerprint.clone(),
            spec.glossary_revision.clone(),
            block_plan_json,
        )
    {
        return Err(DbError::Conflict(
            "run ID refers to different immutable inputs",
        ));
    }
    transaction.commit()?;
    Ok(())
}

pub(crate) fn load(connection: &Connection, run_id: RunId) -> Result<RunSpec, DbError> {
    let row: Option<StoredRunRow> = connection
        .query_row(
            "SELECT translation_id, source_sha256, profile_fingerprint, parser_version, policy_fingerprint, glossary_revision, block_plan_json
             FROM runs WHERE run_id = ?1",
            [run_id.to_string()],
            |row| {
                Ok(StoredRunRow {
                    translation: row.get(0)?,
                    hash: row.get(1)?,
                    profile: row.get(2)?,
                    parser: row.get(3)?,
                    policy: row.get(4)?,
                    glossary: row.get(5)?,
                    plan: row.get(6)?,
                })
            },
        )
        .optional()?;
    let row = row.ok_or(DbError::Conflict("run does not exist"))?;
    let block_ids: Vec<Vec<u32>> = serde_json::from_str(&row.plan)?;
    let blocks = block_ids
        .into_iter()
        .map(|block| {
            block
                .into_iter()
                .map(|id| {
                    SegmentId::new(id)
                        .ok_or(DbError::CorruptRecord("zero segment ID in block plan"))
                })
                .collect::<Result<Vec<_>, _>>()
        })
        .collect::<Result<Vec<_>, _>>()?;
    Ok(RunSpec {
        run_id,
        translation_id: TranslationId::parse(&row.translation)
            .map_err(|_| DbError::CorruptRecord("invalid translation ID in run"))?,
        source_hash: SourceHash::parse_hex(&row.hash)
            .ok_or(DbError::CorruptRecord("invalid run source hash"))?,
        profile_fingerprint: row.profile,
        parser_version: row.parser,
        policy_fingerprint: row.policy,
        glossary_revision: row.glossary,
        blocks,
    })
}
