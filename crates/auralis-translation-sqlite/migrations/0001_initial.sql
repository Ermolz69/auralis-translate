CREATE TABLE translations (
    translation_id TEXT PRIMARY KEY,
    project_id TEXT,
    source_artifact_id TEXT,
    source_locator TEXT,
    source_sha256 TEXT NOT NULL CHECK (length(source_sha256) = 64),
    source_format TEXT NOT NULL,
    source_language TEXT NOT NULL CHECK (source_language IN ('zh', 'ja')),
    target_language TEXT NOT NULL CHECK (target_language = 'ru'),
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    CHECK ((source_artifact_id IS NOT NULL) != (source_locator IS NOT NULL))
);

CREATE TABLE segments (
    translation_id TEXT NOT NULL REFERENCES translations(translation_id) ON DELETE CASCADE,
    segment_id INTEGER NOT NULL CHECK (segment_id > 0),
    ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
    cue_label TEXT NOT NULL,
    start_ms INTEGER NOT NULL CHECK (start_ms >= 0),
    end_ms INTEGER NOT NULL CHECK (end_ms > start_ms),
    source_lines_json TEXT NOT NULL,
    source_map_json TEXT NOT NULL,
    parser_version INTEGER NOT NULL CHECK (parser_version > 0),
    PRIMARY KEY (translation_id, segment_id),
    UNIQUE (translation_id, ordinal)
);

CREATE TABLE runs (
    run_id TEXT PRIMARY KEY,
    translation_id TEXT NOT NULL REFERENCES translations(translation_id) ON DELETE CASCADE,
    state TEXT NOT NULL CHECK (state IN ('requested', 'running', 'paused', 'failed', 'validated')),
    source_sha256 TEXT NOT NULL CHECK (length(source_sha256) = 64),
    profile_fingerprint TEXT NOT NULL,
    parser_version INTEGER NOT NULL CHECK (parser_version > 0),
    policy_fingerprint TEXT NOT NULL,
    glossary_revision TEXT,
    block_plan_json TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX idx_runs_translation ON runs(translation_id, created_at);

CREATE TABLE run_attempts (
    attempt_id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id TEXT NOT NULL REFERENCES runs(run_id) ON DELETE CASCADE,
    host_job_id TEXT,
    started_at INTEGER NOT NULL DEFAULT (unixepoch()),
    ended_at INTEGER,
    stop_reason TEXT
);

CREATE UNIQUE INDEX idx_open_run_attempt ON run_attempts(run_id) WHERE ended_at IS NULL;

CREATE TABLE block_checkpoints (
    run_id TEXT NOT NULL REFERENCES runs(run_id) ON DELETE CASCADE,
    block_index INTEGER NOT NULL CHECK (block_index >= 0),
    input_fingerprint TEXT NOT NULL,
    accepted_json TEXT NOT NULL,
    diagnostics_json TEXT NOT NULL,
    attempt_count INTEGER NOT NULL CHECK (attempt_count > 0),
    committed_at INTEGER NOT NULL DEFAULT (unixepoch()),
    PRIMARY KEY (run_id, block_index)
);

CREATE TABLE results (
    result_id TEXT PRIMARY KEY,
    run_id TEXT NOT NULL REFERENCES runs(run_id) ON DELETE RESTRICT,
    revision INTEGER NOT NULL CHECK (revision > 0),
    source_sha256 TEXT NOT NULL CHECK (length(source_sha256) = 64),
    output_sha256 TEXT NOT NULL CHECK (length(output_sha256) = 64),
    selected_segments_json TEXT NOT NULL,
    structural_evidence_json TEXT NOT NULL,
    review_state TEXT NOT NULL CHECK (review_state IN ('ready', 'needs_review')),
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    UNIQUE (run_id, revision)
);

CREATE TABLE segment_edits (
    translation_id TEXT NOT NULL,
    segment_id INTEGER NOT NULL,
    revision INTEGER NOT NULL CHECK (revision > 0),
    text_lines_json TEXT NOT NULL,
    provenance TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    PRIMARY KEY (translation_id, segment_id, revision),
    FOREIGN KEY (translation_id, segment_id) REFERENCES segments(translation_id, segment_id) ON DELETE RESTRICT
);

CREATE TABLE diagnostics (
    diagnostic_id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id TEXT NOT NULL REFERENCES runs(run_id) ON DELETE CASCADE,
    stage TEXT NOT NULL,
    code TEXT NOT NULL,
    segment_id INTEGER,
    block_index INTEGER,
    detail_json TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX idx_diagnostics_run ON diagnostics(run_id, diagnostic_id);
