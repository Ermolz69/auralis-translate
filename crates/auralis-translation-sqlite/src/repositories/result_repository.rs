use crate::repositories::checkpoint_repository;
use crate::{DbError, ResultRecord, ResultSpec};
use auralis_translation::{
    ResultId, ReviewState, RunId, SourceHash, TargetSegment, VerifiedRenderer,
};
use rusqlite::{Connection, OptionalExtension, TransactionBehavior, params};

pub(crate) fn commit<V: VerifiedRenderer>(
    connection: &mut Connection,
    spec: &ResultSpec,
    renderer: &V,
) -> Result<ResultRecord, DbError> {
    if spec.revision == 0 || spec.block_fingerprints.is_empty() {
        return Err(DbError::InvalidSpec("incomplete result revision or plan"));
    }
    if renderer.source_hash() != spec.source_hash {
        return Err(DbError::Conflict(
            "renderer source differs from result source",
        ));
    }
    let evidence_json = renderer.structural_evidence();
    let evidence: serde_json::Value = serde_json::from_str(evidence_json)
        .map_err(|_| DbError::InvalidSpec("invalid structural evidence JSON"))?;
    if !evidence.is_object() {
        return Err(DbError::InvalidSpec(
            "structural evidence must be an object",
        ));
    }
    let transaction = connection.transaction_with_behavior(TransactionBehavior::Immediate)?;
    crate::name_registry_store::check_current(&transaction, spec.run_id)?;
    let run: Option<(String, String, String, bool)> = transaction
        .query_row(
            "SELECT source_sha256, block_plan_json, state, pause_requested FROM runs WHERE run_id = ?1",
            [spec.run_id.to_string()],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?)),
        )
        .optional()?;
    let (run_hash, plan_json, state, pause_requested) =
        run.ok_or(DbError::Conflict("run does not exist"))?;
    if state == "running" && pause_requested {
        return Err(DbError::PauseRequested);
    }
    if run_hash != spec.source_hash.to_string() {
        return Err(DbError::Conflict("result source differs from run source"));
    }
    let blocks: Vec<Vec<u32>> = serde_json::from_str(&plan_json)?;
    if blocks.len() != spec.block_fingerprints.len() {
        return Err(DbError::InvalidSpec(
            "result block count differs from run plan",
        ));
    }
    let checkpoints = checkpoint_repository::load(&transaction, spec.run_id)?;
    if checkpoints.len() != blocks.len() {
        return Err(DbError::Conflict("result has incomplete checkpoints"));
    }
    let mut selected: Vec<TargetSegment> = Vec::new();
    for (index, (expected_ids, checkpoint)) in blocks.iter().zip(checkpoints).enumerate() {
        if usize::try_from(checkpoint.block_index).ok() != Some(index)
            || checkpoint.input_fingerprint != spec.block_fingerprints[index]
            || expected_ids.as_slice()
                != checkpoint
                    .accepted
                    .iter()
                    .map(|segment| segment.id.get())
                    .collect::<Vec<_>>()
        {
            return Err(DbError::Conflict(
                "checkpoint differs from frozen result plan",
            ));
        }
        selected.extend(checkpoint.accepted);
    }
    let selected_json = checkpoint_repository::encode_segments(&selected)?;
    let verified_output = renderer
        .render_selected(&selected)
        .map_err(|error| DbError::Verification(error.to_string()))?;
    if verified_output.is_empty() {
        return Err(DbError::Verification("rendered output is empty".into()));
    }
    let output_hash = SourceHash::digest(&verified_output);
    let review_state = review_state_str(spec.review_state);
    if state != "running" && state != "validated" {
        return Err(DbError::Conflict("run is not ready for a result"));
    }
    if state == "validated" {
        let existing: Option<u32> = transaction
            .query_row(
                "SELECT 1 FROM results WHERE result_id = ?1",
                [spec.result_id.to_string()],
                |row| row.get(0),
            )
            .optional()?;
        if existing.is_none() {
            return Err(DbError::Conflict(
                "validated run cannot create a new initial result",
            ));
        }
    }
    transaction.execute(
        "INSERT INTO results (result_id, run_id, revision, source_sha256, output_sha256, selected_segments_json, structural_evidence_json, review_state)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
         ON CONFLICT(result_id) DO NOTHING",
        params![spec.result_id.to_string(), spec.run_id.to_string(), spec.revision,
            spec.source_hash.to_string(), output_hash.to_string(), selected_json,
            evidence_json, review_state],
    )?;
    let stored = load_from_connection(&transaction, spec.result_id)?;
    if stored.run_id != spec.run_id
        || stored.revision != spec.revision
        || stored.source_hash != spec.source_hash
        || stored.output_hash != output_hash
        || stored.selected != selected
        || stored.structural_evidence_json != evidence_json
        || stored.review_state != spec.review_state
    {
        return Err(DbError::Conflict(
            "result ID refers to different immutable data",
        ));
    }
    if state == "running" {
        let changed = transaction.execute(
            "UPDATE run_attempts SET ended_at = unixepoch(), stop_reason = 'validated'
             WHERE run_id = ?1 AND ended_at IS NULL",
            [spec.run_id.to_string()],
        )?;
        if changed != 1 {
            return Err(DbError::CorruptRecord("running run has no open attempt"));
        }
        transaction.execute(
            "UPDATE runs SET state = 'validated', updated_at = unixepoch() WHERE run_id = ?1",
            [spec.run_id.to_string()],
        )?;
    }
    transaction.commit()?;
    Ok(stored)
}

pub(crate) fn load(connection: &Connection, result_id: ResultId) -> Result<ResultRecord, DbError> {
    load_from_connection(connection, result_id)
}

pub(crate) fn for_run(connection: &Connection, run_id: RunId) -> Result<ResultRecord, DbError> {
    let id: Option<String> = connection
        .query_row(
            "SELECT result_id FROM results WHERE run_id = ?1 ORDER BY revision DESC LIMIT 1",
            [run_id.to_string()],
            |row| row.get(0),
        )
        .optional()?;
    let id = id.ok_or(DbError::Conflict("run has no result"))?;
    let result_id =
        ResultId::parse(&id).map_err(|_| DbError::CorruptRecord("invalid result ID"))?;
    load_from_connection(connection, result_id)
}

pub(crate) fn load_from_connection(
    connection: &Connection,
    result_id: ResultId,
) -> Result<ResultRecord, DbError> {
    let stored: Option<(String, u32, String, String, String, String, String)> = connection
        .query_row(
            "SELECT run_id, revision, source_sha256, output_sha256, selected_segments_json, structural_evidence_json, review_state
             FROM results WHERE result_id = ?1",
            [result_id.to_string()],
            |row| {
                Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?, row.get(4)?, row.get(5)?, row.get(6)?))
            },
        )
        .optional()?;
    let (run_id, revision, source_hash, output_hash, selected_json, evidence, review) =
        stored.ok_or(DbError::Conflict("result does not exist"))?;
    let run_id =
        RunId::parse(&run_id).map_err(|_| DbError::CorruptRecord("invalid result run ID"))?;
    let review_state = match review.as_str() {
        "ready" => ReviewState::Ready,
        "needs_review" => ReviewState::NeedsReview,
        _ => return Err(DbError::CorruptRecord("unknown review state")),
    };
    Ok(ResultRecord {
        result_id,
        run_id,
        revision,
        source_hash: checkpoint_repository::decode_hash(&source_hash)?,
        output_hash: checkpoint_repository::decode_hash(&output_hash)?,
        selected: checkpoint_repository::decode_segments(&selected_json)?,
        structural_evidence_json: evidence,
        review_state,
    })
}

fn review_state_str(state: ReviewState) -> &'static str {
    match state {
        ReviewState::Ready => "ready",
        ReviewState::NeedsReview => "needs_review",
    }
}
