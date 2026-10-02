use crate::{AttemptId, DbError, InferenceRequestRecord};
use auralis_translation::{
    InferenceRequestFinish, InferenceRequestId, InferenceRequestKind, InferenceRequestOutcome,
    InferenceRequestStart, RunId, SegmentId, SourceHash,
};
use rusqlite::{Connection, OptionalExtension, Row, TransactionBehavior, params};

const COLUMNS: &str =
    "sequence, request_id, run_id, attempt_id, request_kind, batch_fingerprint, segment_id,
    line_index, request_sha256, rendered_request, outcome, raw_response, restored_candidate,
    prompt_tokens, completion_tokens, elapsed_ms, error_detail";

struct StoredRequest {
    sequence: i64,
    request_id: String,
    run_id: String,
    attempt_id: i64,
    request_kind: String,
    batch_fingerprint: String,
    segment_id: u32,
    line_index: u32,
    request_sha256: String,
    rendered_request: Vec<u8>,
    outcome: String,
    raw_response: Option<Vec<u8>>,
    restored_candidate: Option<String>,
    prompt_tokens: Option<i64>,
    completion_tokens: Option<i64>,
    elapsed_ms: Option<i64>,
    error_detail: Option<String>,
}

impl StoredRequest {
    fn from_row(row: &Row<'_>) -> rusqlite::Result<Self> {
        Ok(Self {
            sequence: row.get(0)?,
            request_id: row.get(1)?,
            run_id: row.get(2)?,
            attempt_id: row.get(3)?,
            request_kind: row.get(4)?,
            batch_fingerprint: row.get(5)?,
            segment_id: row.get(6)?,
            line_index: row.get(7)?,
            request_sha256: row.get(8)?,
            rendered_request: row.get(9)?,
            outcome: row.get(10)?,
            raw_response: row.get(11)?,
            restored_candidate: row.get(12)?,
            prompt_tokens: row.get(13)?,
            completion_tokens: row.get(14)?,
            elapsed_ms: row.get(15)?,
            error_detail: row.get(16)?,
        })
    }

    fn decode(self) -> Result<InferenceRequestRecord, DbError> {
        let request_id = InferenceRequestId::parse(&self.request_id)
            .map_err(|_| DbError::CorruptRecord("invalid inference request ID"))?;
        let run_id = RunId::parse(&self.run_id)
            .map_err(|_| DbError::CorruptRecord("invalid inference run ID"))?;
        let kind = InferenceRequestKind::parse(&self.request_kind)
            .ok_or(DbError::CorruptRecord("invalid inference request kind"))?;
        let batch_fingerprint = SourceHash::parse_hex(&self.batch_fingerprint).ok_or(
            DbError::CorruptRecord("invalid inference batch fingerprint"),
        )?;
        let request_sha256 = SourceHash::parse_hex(&self.request_sha256)
            .ok_or(DbError::CorruptRecord("invalid inference request digest"))?;
        if self.sequence <= 0
            || self.attempt_id <= 0
            || self.rendered_request.is_empty()
            || request_sha256 != SourceHash::digest(&self.rendered_request)
        {
            return Err(DbError::CorruptRecord("invalid inference request record"));
        }
        let segment_id = SegmentId::new(self.segment_id)
            .ok_or(DbError::CorruptRecord("invalid inference segment ID"))?;
        let start = InferenceRequestStart {
            request_id,
            kind,
            run_id,
            batch_fingerprint,
            segment_id,
            line_index: self.line_index,
            rendered_request: self.rendered_request,
        };
        let finish = if self.outcome == "pending" {
            if self.raw_response.is_some()
                || self.restored_candidate.is_some()
                || self.prompt_tokens.is_some()
                || self.completion_tokens.is_some()
                || self.elapsed_ms.is_some()
                || self.error_detail.is_some()
            {
                return Err(DbError::CorruptRecord(
                    "pending inference request has a result",
                ));
            }
            None
        } else {
            let outcome = InferenceRequestOutcome::parse(&self.outcome)
                .ok_or(DbError::CorruptRecord("invalid inference request outcome"))?;
            Some(InferenceRequestFinish {
                request_id,
                outcome,
                raw_response: self.raw_response,
                restored_candidate: self.restored_candidate,
                prompt_tokens: self
                    .prompt_tokens
                    .map(u32::try_from)
                    .transpose()
                    .map_err(|_| DbError::CorruptRecord("invalid inference prompt tokens"))?,
                completion_tokens: self
                    .completion_tokens
                    .map(u32::try_from)
                    .transpose()
                    .map_err(|_| DbError::CorruptRecord("invalid inference completion tokens"))?,
                elapsed_ms: u64::try_from(self.elapsed_ms.ok_or(DbError::CorruptRecord(
                    "completed inference request has no duration",
                ))?)
                .map_err(|_| DbError::CorruptRecord("invalid inference duration"))?,
                error_detail: self.error_detail,
            })
        };
        if let Some(result) = &finish
            && ((kind == InferenceRequestKind::ChatCompletion
                && result.outcome == InferenceRequestOutcome::ParsedPreflightJson)
                || (kind != InferenceRequestKind::ChatCompletion
                    && (matches!(
                        result.outcome,
                        InferenceRequestOutcome::ValidatedLine
                            | InferenceRequestOutcome::ValidatedBatch
                    ) || result.restored_candidate.is_some())))
        {
            return Err(DbError::CorruptRecord("inference kind and outcome differ"));
        }
        Ok(InferenceRequestRecord {
            sequence: self.sequence,
            attempt_id: AttemptId(self.attempt_id),
            start,
            finish,
        })
    }
}

pub(crate) fn begin(
    connection: &mut Connection,
    attempt_id: AttemptId,
    start: &InferenceRequestStart,
) -> Result<(), DbError> {
    if start.rendered_request.is_empty() {
        return Err(DbError::InvalidSpec("inference request is empty"));
    }
    let transaction = connection.transaction_with_behavior(TransactionBehavior::Immediate)?;
    let active_run: Option<String> = transaction
        .query_row(
            "SELECT run_id FROM run_attempts WHERE attempt_id = ?1 AND ended_at IS NULL",
            [attempt_id.get()],
            |row| row.get(0),
        )
        .optional()?;
    if active_run.as_deref() != Some(start.run_id.to_string().as_str()) {
        return Err(DbError::Conflict(
            "inference request has no matching open run attempt",
        ));
    }
    let source_lines: Option<String> = transaction
        .query_row(
            "SELECT source_lines_json FROM segments WHERE segment_id = ?2
             AND translation_id = (SELECT translation_id FROM runs WHERE run_id = ?1)",
            params![start.run_id.to_string(), start.segment_id.get()],
            |row| row.get(0),
        )
        .optional()?;
    let source_lines: Vec<String> = serde_json::from_str(
        &source_lines.ok_or(DbError::Conflict("inference segment is not in the run"))?,
    )?;
    if usize::try_from(start.line_index)
        .ok()
        .is_none_or(|index| index >= source_lines.len())
    {
        return Err(DbError::InvalidSpec(
            "inference line is outside the source segment",
        ));
    }
    transaction.execute(
        "INSERT INTO inference_requests (request_id, run_id, attempt_id, request_kind,
            batch_fingerprint, segment_id, line_index, request_sha256, rendered_request)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
         ON CONFLICT(request_id) DO NOTHING",
        params![
            start.request_id.to_string(),
            start.run_id.to_string(),
            attempt_id.get(),
            start.kind.as_str(),
            start.batch_fingerprint.to_string(),
            start.segment_id.get(),
            start.line_index,
            start.request_sha256().to_string(),
            start.rendered_request,
        ],
    )?;
    let saved = load_one(&transaction, start.request_id)?
        .ok_or(DbError::CorruptRecord("inference request was not saved"))?;
    if saved.attempt_id != attempt_id || saved.start != *start || saved.finish.is_some() {
        return Err(DbError::Conflict(
            "inference request ID has different content",
        ));
    }
    transaction.commit()?;
    Ok(())
}

pub(crate) fn finish(
    connection: &mut Connection,
    finish: &InferenceRequestFinish,
) -> Result<(), DbError> {
    if matches!(
        finish.outcome,
        InferenceRequestOutcome::ValidatedLine | InferenceRequestOutcome::ValidatedBatch
    ) {
        if finish.raw_response.is_none()
            || finish
                .restored_candidate
                .as_deref()
                .is_none_or(str::is_empty)
            || finish.error_detail.is_some()
        {
            return Err(DbError::InvalidSpec(
                "validated inference response is incomplete",
            ));
        }
    } else if finish.outcome == InferenceRequestOutcome::ParsedPreflightJson {
        if finish.raw_response.is_none()
            || finish.restored_candidate.is_some()
            || finish.error_detail.is_some()
        {
            return Err(DbError::InvalidSpec(
                "parsed preflight response is incomplete",
            ));
        }
    } else if finish.error_detail.as_deref().is_none_or(str::is_empty) {
        return Err(DbError::InvalidSpec(
            "failed inference request has no error",
        ));
    }
    if matches!(
        finish.outcome,
        InferenceRequestOutcome::MalformedCandidate | InferenceRequestOutcome::InvalidCandidate
    ) && finish.raw_response.is_none()
    {
        return Err(DbError::InvalidSpec(
            "rejected candidate has no raw response",
        ));
    }
    let elapsed_ms = i64::try_from(finish.elapsed_ms)
        .map_err(|_| DbError::InvalidSpec("inference duration exceeds SQLite range"))?;
    let transaction = connection.transaction_with_behavior(TransactionBehavior::Immediate)?;
    let saved = load_one(&transaction, finish.request_id)?
        .ok_or(DbError::Conflict("inference request does not exist"))?;
    if (saved.start.kind == InferenceRequestKind::ChatCompletion
        && finish.outcome == InferenceRequestOutcome::ParsedPreflightJson)
        || (saved.start.kind != InferenceRequestKind::ChatCompletion
            && (matches!(
                finish.outcome,
                InferenceRequestOutcome::ValidatedLine | InferenceRequestOutcome::ValidatedBatch
            ) || finish.restored_candidate.is_some()))
    {
        return Err(DbError::InvalidSpec("inference kind and outcome differ"));
    }
    let changed = transaction.execute(
        "UPDATE inference_requests SET outcome = ?2, raw_response = ?3,
            restored_candidate = ?4, prompt_tokens = ?5, completion_tokens = ?6,
            elapsed_ms = ?7, error_detail = ?8, finished_at = unixepoch()
         WHERE request_id = ?1 AND outcome = 'pending'
           AND EXISTS (SELECT 1 FROM run_attempts WHERE attempt_id = inference_requests.attempt_id
               AND ended_at IS NULL)",
        params![
            finish.request_id.to_string(),
            finish.outcome.as_str(),
            finish.raw_response,
            finish.restored_candidate,
            finish.prompt_tokens,
            finish.completion_tokens,
            elapsed_ms,
            finish.error_detail,
        ],
    )?;
    if changed != 1 {
        let saved = load_one(&transaction, finish.request_id)?
            .ok_or(DbError::Conflict("inference request does not exist"))?;
        if saved.finish.as_ref() != Some(finish) {
            return Err(DbError::Conflict(
                "inference request result differs from saved result",
            ));
        }
    }
    transaction.commit()?;
    Ok(())
}

pub(crate) fn load(
    connection: &Connection,
    run_id: RunId,
) -> Result<Vec<InferenceRequestRecord>, DbError> {
    let mut statement = connection.prepare(&format!(
        "SELECT {COLUMNS} FROM inference_requests WHERE run_id = ?1 ORDER BY sequence"
    ))?;
    let rows = statement.query_map([run_id.to_string()], StoredRequest::from_row)?;
    rows.map(|row| row?.decode()).collect()
}

fn load_one(
    connection: &Connection,
    request_id: InferenceRequestId,
) -> Result<Option<InferenceRequestRecord>, DbError> {
    let stored = connection
        .query_row(
            &format!("SELECT {COLUMNS} FROM inference_requests WHERE request_id = ?1"),
            [request_id.to_string()],
            StoredRequest::from_row,
        )
        .optional()?;
    stored.map(StoredRequest::decode).transpose()
}
