CREATE TABLE inference_requests_v9 (
    sequence INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id TEXT NOT NULL UNIQUE CHECK (length(request_id) = 36),
    run_id TEXT NOT NULL REFERENCES runs(run_id) ON DELETE CASCADE,
    attempt_id INTEGER NOT NULL REFERENCES run_attempts(attempt_id) ON DELETE CASCADE,
    request_kind TEXT NOT NULL CHECK (request_kind IN ('chat_completion', 'apply_template', 'tokenize')),
    batch_fingerprint TEXT NOT NULL CHECK (length(batch_fingerprint) = 64),
    segment_id INTEGER NOT NULL CHECK (segment_id > 0),
    line_index INTEGER NOT NULL CHECK (line_index >= 0),
    request_sha256 TEXT NOT NULL CHECK (length(request_sha256) = 64),
    rendered_request BLOB NOT NULL CHECK (length(rendered_request) > 0),
    outcome TEXT NOT NULL DEFAULT 'pending' CHECK (outcome IN (
        'pending', 'validated_line', 'validated_batch', 'parsed_preflight_json', 'malformed_candidate',
        'invalid_candidate', 'transport_failure', 'timeout', 'resource_failure',
        'paused', 'other_permanent'
    )),
    raw_response BLOB,
    restored_candidate TEXT,
    prompt_tokens INTEGER CHECK (prompt_tokens >= 0),
    completion_tokens INTEGER CHECK (completion_tokens >= 0),
    elapsed_ms INTEGER CHECK (elapsed_ms >= 0),
    error_detail TEXT,
    started_at INTEGER NOT NULL DEFAULT (unixepoch()),
    finished_at INTEGER,
    CHECK ((outcome = 'pending' AND raw_response IS NULL AND restored_candidate IS NULL
            AND prompt_tokens IS NULL AND completion_tokens IS NULL AND elapsed_ms IS NULL
            AND error_detail IS NULL AND finished_at IS NULL)
        OR (outcome != 'pending' AND elapsed_ms IS NOT NULL AND finished_at IS NOT NULL)),
    CHECK (outcome NOT IN ('validated_line', 'validated_batch') OR
        (request_kind = 'chat_completion' AND raw_response IS NOT NULL
         AND restored_candidate IS NOT NULL AND error_detail IS NULL)),
    CHECK (outcome != 'parsed_preflight_json' OR
        (request_kind != 'chat_completion' AND raw_response IS NOT NULL
         AND restored_candidate IS NULL AND error_detail IS NULL)),
    CHECK (request_kind = 'chat_completion' OR restored_candidate IS NULL)
);

INSERT INTO inference_requests_v9 (
    sequence, request_id, run_id, attempt_id, request_kind, batch_fingerprint,
    segment_id, line_index, request_sha256, rendered_request, outcome,
    raw_response, restored_candidate, prompt_tokens, completion_tokens,
    elapsed_ms, error_detail, started_at, finished_at
)
SELECT sequence, request_id, run_id, attempt_id, request_kind, batch_fingerprint,
    segment_id, line_index, request_sha256, rendered_request, outcome,
    raw_response, restored_candidate, prompt_tokens, completion_tokens,
    elapsed_ms, error_detail, started_at, finished_at
FROM inference_requests;

DROP TABLE inference_requests;
ALTER TABLE inference_requests_v9 RENAME TO inference_requests;
CREATE INDEX idx_inference_requests_run ON inference_requests(run_id, sequence);
