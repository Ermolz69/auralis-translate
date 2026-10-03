use crate::{DbError, TranslateDb, name_registry_codec};
use auralis_translation::{
    NameRegistry, RunId, SceneMap, SourceHash, SourceSegment, TranslationId,
};
use rusqlite::{OptionalExtension, TransactionBehavior, params};

impl TranslateDb {
    pub fn name_registry_scene_map(
        &self,
        translation_id: TranslationId,
    ) -> Result<SceneMap, DbError> {
        let ends: String = self.connection.query_row("SELECT scene_end_ids_json FROM name_registry_revisions WHERE translation_id=?1 ORDER BY revision DESC LIMIT 1",
            [translation_id.to_string()], |row| row.get(0))?;
        let ends: Vec<u32> = serde_json::from_str(&ends)?;
        let ends = ends
            .into_iter()
            .map(|id| {
                auralis_translation::SegmentId::new(id)
                    .ok_or(DbError::CorruptRecord("invalid registry scene ID"))
            })
            .collect::<Result<Vec<_>, _>>()?;
        SceneMap::new(&source_segments(self, translation_id)?, &ends)
            .map_err(|_| DbError::CorruptRecord("invalid registry scene map"))
    }
    pub fn append_name_registry(
        &mut self,
        registry: &NameRegistry,
        scenes: &SceneMap,
        expected_head: Option<SourceHash>,
    ) -> Result<(), DbError> {
        let translation = self.translation(registry.translation_id())?;
        let segments = source_segments(self, registry.translation_id())?;
        if translation.source_hash != registry.source_hash() {
            return Err(DbError::Conflict(
                "name registry source differs from translation",
            ));
        }
        registry
            .validate_against(&segments, scenes)
            .map_err(|_| DbError::InvalidSpec("name registry occurrences differ from source"))?;
        let payload = name_registry_codec::encode(registry)?;
        let ends = scenes
            .ranges()
            .iter()
            .map(|range| segments[range.end - 1].id().get())
            .collect::<Vec<_>>();
        let transaction = self
            .connection
            .transaction_with_behavior(TransactionBehavior::Immediate)?;
        let head: Option<(u32, String)> = transaction.query_row(
            "SELECT revision, fingerprint FROM name_registry_revisions WHERE translation_id=?1 ORDER BY revision DESC LIMIT 1",
            [registry.translation_id().to_string()], |row| Ok((row.get(0)?, row.get(1)?))).optional()?;
        if head.as_ref().is_some_and(|(revision, hash)| {
            *revision == registry.revision().get() && hash == &registry.fingerprint().to_string()
        }) {
            return Ok(());
        }
        let head_hash = head
            .as_ref()
            .map(|(_, hash)| {
                SourceHash::parse_hex(hash)
                    .ok_or(DbError::CorruptRecord("invalid registry head fingerprint"))
            })
            .transpose()?;
        let next = head
            .as_ref()
            .map_or(Some(1), |(revision, _)| revision.checked_add(1));
        if head_hash != expected_head || next != Some(registry.revision().get()) {
            return Err(DbError::Conflict(
                "name registry head changed or revision is not sequential",
            ));
        }
        transaction.execute("INSERT INTO name_registry_revisions (translation_id, revision, fingerprint, payload_json, scene_end_ids_json) VALUES (?1,?2,?3,?4,?5)",
            params![registry.translation_id().to_string(), registry.revision().get(),
                registry.fingerprint().to_string(), payload, serde_json::to_string(&ends)?])?;
        transaction.commit()?;
        Ok(())
    }

    pub fn name_registry(
        &self,
        translation_id: TranslationId,
    ) -> Result<Option<NameRegistry>, DbError> {
        self.load_name_registry_revision(translation_id, None)
    }

    fn load_name_registry_revision(
        &self,
        translation_id: TranslationId,
        revision: Option<u32>,
    ) -> Result<Option<NameRegistry>, DbError> {
        let row: Option<(String, String, String)> = self.connection.query_row(
            "SELECT payload_json, fingerprint, scene_end_ids_json FROM name_registry_revisions WHERE translation_id=?1 AND (?2 IS NULL OR revision=?2) ORDER BY revision DESC LIMIT 1",
            params![translation_id.to_string(),revision], |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?))).optional()?;
        row.map(|(payload, fingerprint, ends)| {
            let registry = name_registry_codec::decode(&payload)?;
            let segments = source_segments(self, translation_id)?;
            let end_ids: Vec<u32> = serde_json::from_str(&ends)?;
            let end_ids = end_ids
                .into_iter()
                .map(|id| {
                    auralis_translation::SegmentId::new(id)
                        .ok_or(DbError::CorruptRecord("invalid registry scene ID"))
                })
                .collect::<Result<Vec<_>, _>>()?;
            let scenes = SceneMap::new(&segments, &end_ids)
                .map_err(|_| DbError::CorruptRecord("invalid registry scene map"))?;
            if registry.translation_id() != translation_id
                || registry.source_hash() != self.translation(translation_id)?.source_hash
                || registry.fingerprint().to_string() != fingerprint
            {
                return Err(DbError::CorruptRecord("name registry identity differs"));
            }
            registry
                .validate_against(&segments, &scenes)
                .map_err(|_| DbError::CorruptRecord("name registry source occurrences differ"))?;
            Ok(registry)
        })
        .transpose()
    }

    pub fn bind_name_registry(
        &mut self,
        run_id: RunId,
        registry: &NameRegistry,
    ) -> Result<(), DbError> {
        let run = self.run(run_id)?;
        if run.translation_id != registry.translation_id()
            || run.source_hash != registry.source_hash()
        {
            return Err(DbError::Conflict(
                "name registry belongs to another run source",
            ));
        }
        let transaction = self
            .connection
            .transaction_with_behavior(TransactionBehavior::Immediate)?;
        let head: String = transaction.query_row(
            "SELECT fingerprint FROM name_registry_revisions WHERE translation_id=?1 ORDER BY revision DESC LIMIT 1",
            [registry.translation_id().to_string()], |row| row.get(0))?;
        if head != registry.fingerprint().to_string() {
            return Err(DbError::Conflict("name registry head changed"));
        }
        let existing: Option<u32> = transaction
            .query_row(
                "SELECT revision FROM run_name_registries WHERE run_id=?1",
                [run_id.to_string()],
                |row| row.get(0),
            )
            .optional()?;
        if existing.is_some_and(|revision| revision != registry.revision().get()) {
            return Err(DbError::Conflict("run has another frozen name registry"));
        }
        if existing.is_none() {
            let attempts: u32 = transaction.query_row(
                "SELECT count(*) FROM run_attempts WHERE run_id=?1",
                [run_id.to_string()],
                |row| row.get(0),
            )?;
            if attempts != 0 {
                return Err(DbError::Conflict("cannot bind names after an attempt"));
            }
        }
        transaction.execute("INSERT INTO run_name_registries (run_id, translation_id, revision) VALUES (?1,?2,?3) ON CONFLICT(run_id) DO NOTHING",
            params![run_id.to_string(), registry.translation_id().to_string(), registry.revision().get()])?;
        transaction.commit()?;
        Ok(())
    }

    pub fn name_registry_for_run(&self, run_id: RunId) -> Result<Option<NameRegistry>, DbError> {
        check_current(&self.connection, run_id)?;
        self.frozen_name_registry_for_run(run_id)
    }

    pub fn frozen_name_registry_for_run(
        &self,
        run_id: RunId,
    ) -> Result<Option<NameRegistry>, DbError> {
        let binding: Option<u32> = self
            .connection
            .query_row(
                "SELECT revision FROM run_name_registries WHERE run_id=?1",
                [run_id.to_string()],
                |row| row.get(0),
            )
            .optional()?;
        let Some(revision) = binding else {
            return Ok(None);
        };
        let registry = self
            .load_name_registry_revision(self.run(run_id)?.translation_id, Some(revision))?
            .ok_or(DbError::CorruptRecord("run name registry is missing"))?;
        if registry.revision().get() != revision {
            return Err(DbError::Conflict("frozen name registry revision differs"));
        }
        Ok(Some(registry))
    }
}

fn source_segments(db: &TranslateDb, id: TranslationId) -> Result<Vec<SourceSegment>, DbError> {
    db.segments(id)?
        .into_iter()
        .map(|segment| {
            SourceSegment::new(
                segment.id,
                segment.start_ms,
                segment.end_ms,
                segment.source_lines,
            )
            .map_err(|_| DbError::CorruptRecord("invalid registry source segment"))
        })
        .collect()
}

pub(crate) fn check_current(
    connection: &rusqlite::Connection,
    run_id: RunId,
) -> Result<(), DbError> {
    let changed: bool = connection.query_row("SELECT EXISTS (SELECT 1 FROM run_name_registries b WHERE b.run_id=?1 AND b.revision != (SELECT max(r.revision) FROM name_registry_revisions r WHERE r.translation_id=b.translation_id))",
        [run_id.to_string()], |row| row.get(0))?;
    if changed {
        return Err(DbError::Conflict(
            "name registry changed; start a fresh run",
        ));
    }
    Ok(())
}
