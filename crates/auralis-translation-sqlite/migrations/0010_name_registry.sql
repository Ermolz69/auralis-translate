CREATE TABLE name_registry_revisions (
    translation_id TEXT NOT NULL REFERENCES translations(translation_id) ON DELETE CASCADE,
    revision INTEGER NOT NULL CHECK (revision > 0),
    fingerprint TEXT NOT NULL CHECK (length(fingerprint) = 64),
    payload_json TEXT NOT NULL,
    scene_end_ids_json TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    PRIMARY KEY (translation_id, revision),
    UNIQUE (translation_id, fingerprint)
);

CREATE TABLE run_name_registries (
    run_id TEXT PRIMARY KEY REFERENCES runs(run_id) ON DELETE CASCADE,
    translation_id TEXT NOT NULL,
    revision INTEGER NOT NULL,
    FOREIGN KEY (translation_id, revision)
        REFERENCES name_registry_revisions(translation_id, revision) ON DELETE CASCADE
);
