CREATE TABLE result_edit_provenance (
    result_id TEXT PRIMARY KEY NOT NULL REFERENCES results(result_id) ON DELETE CASCADE,
    base_result_id TEXT NOT NULL REFERENCES results(result_id),
    observed_head_result_id TEXT NOT NULL REFERENCES results(result_id),
    segment_id INTEGER NOT NULL CHECK (segment_id > 0),
    CHECK (result_id != base_result_id AND result_id != observed_head_result_id)
);

CREATE INDEX idx_result_edit_provenance_base ON result_edit_provenance(base_result_id);
