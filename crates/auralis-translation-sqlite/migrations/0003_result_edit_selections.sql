CREATE TABLE result_edit_selections (
    result_id TEXT NOT NULL REFERENCES results(result_id) ON DELETE CASCADE,
    translation_id TEXT NOT NULL,
    segment_id INTEGER NOT NULL CHECK (segment_id > 0),
    edit_revision INTEGER NOT NULL CHECK (edit_revision > 0),
    PRIMARY KEY (result_id, segment_id),
    FOREIGN KEY (translation_id, segment_id, edit_revision)
        REFERENCES segment_edits(translation_id, segment_id, revision)
);

CREATE INDEX idx_result_edit_selections_edit
    ON result_edit_selections(translation_id, segment_id, edit_revision);
