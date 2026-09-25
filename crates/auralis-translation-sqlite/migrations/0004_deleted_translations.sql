CREATE TABLE deleted_translations (
    translation_id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    deleted_at INTEGER NOT NULL DEFAULT (unixepoch())
);
