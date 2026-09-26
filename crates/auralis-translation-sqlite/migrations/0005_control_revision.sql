ALTER TABLE runs ADD COLUMN control_revision INTEGER NOT NULL DEFAULT 0
    CHECK (typeof(control_revision) = 'integer' AND control_revision >= 0);
