use crate::reporting::CommandOutput;
use crate::{durable_workflow::DATABASE_FILE, name_proposals_input};
use auralis_translation::TranslationId;
use auralis_translation_sqlite::{SqliteConfig, TranslateDb};
use std::error::Error;
use std::ffi::OsStr;
use std::num::NonZeroU32;
use std::path::Path;

pub(crate) fn run(
    state_dir: &OsStr,
    translation_id: &OsStr,
    proposals: Option<&OsStr>,
    reporter: &mut CommandOutput,
) -> Result<(), Box<dyn Error>> {
    let id = TranslationId::parse(
        translation_id
            .to_str()
            .ok_or("translation ID must be Unicode")?,
    )?;
    let path = Path::new(state_dir).join(DATABASE_FILE);
    if !path.is_file() {
        return Err("Translate database is missing".into());
    }
    let mut db = TranslateDb::open(&path, SqliteConfig::default())?;
    let mut registry = db
        .name_registry(id)?
        .ok_or("translation has no name registry")?;
    if let Some(proposals) = proposals {
        let revision = registry
            .revision()
            .get()
            .checked_add(1)
            .and_then(NonZeroU32::new)
            .ok_or("name registry revision overflow")?;
        let revised = name_proposals_input::read(Path::new(proposals), &registry, revision)?;
        let scenes = db.name_registry_scene_map(id)?;
        db.append_name_registry(&revised, &scenes, Some(registry.fingerprint()))?;
        registry = revised;
    }
    let entities = registry.entries().iter().map(|entity| serde_json::json!({
        "entity_id":entity.id.get(), "chinese":entity.chinese, "possible_aliases":entity.possible_aliases,
        "status": entity.status.as_str(), "revision":entity.revision.get(),
        "proposal": entity.proposal.as_ref().map(|p| serde_json::json!({"russian":p.russian,
            "origin":p.origin.as_str(),"evidence_id":p.evidence_id,"reviewer_id":p.reviewer_id})),
        "occurrences":entity.occurrences.iter().map(|o| serde_json::json!({"segment_id":o.segment_id.get(),
            "line_index":o.line_index,"byte_start":o.bytes.start,"byte_end":o.bytes.end,
            "scene_index":o.scene_index,"surface":o.surface})).collect::<Vec<_>>()
    })).collect::<Vec<_>>();
    reporter.report("name-registry", &serde_json::json!({"schema_version":1,
        "translation_id":id.to_string(), "source_sha256":registry.source_hash().to_string(),
        "scene_sha256":registry.scene_hash().to_string(), "fingerprint":registry.fingerprint().to_string(),
        "revision":registry.revision().get(), "policy_id":registry.policy_id(), "entities":entities}))
}
