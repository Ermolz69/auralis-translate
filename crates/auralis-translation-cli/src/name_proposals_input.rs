use crate::read_source::read_bounded;
use auralis_translation::{NameProposal, NameProposalOrigin, NameRegistry, NameStatus, SourceHash};
use auralis_translation_formats::srt::SrtParsePolicy;
use serde::Deserialize;
use std::collections::HashSet;
use std::error::Error;
use std::num::NonZeroU32;
use std::path::Path;

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Payload {
    schema_version: u32,
    source_sha256: String,
    extraction_policy_id: String,
    expected_revision: u32,
    proposals: Vec<Proposal>,
}
#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Proposal {
    entity_id: u32,
    chinese: String,
    scene_index: usize,
    russian: String,
    origin: String,
    evidence_id: String,
}

pub(crate) fn read(
    path: &Path,
    registry: &NameRegistry,
    new_revision: NonZeroU32,
) -> Result<NameRegistry, Box<dyn Error>> {
    let payload: Payload = serde_json::from_slice(&read_bounded(
        path,
        SrtParsePolicy::default().max_bytes(),
        "name proposals",
    )?)?;
    if payload.schema_version != 1
        || SourceHash::parse_hex(&payload.source_sha256) != Some(registry.source_hash())
        || payload.extraction_policy_id != registry.policy_id()
        || payload.expected_revision != registry.revision().get()
    {
        return Err(
            "name proposals differ from source, extraction policy or registry revision".into(),
        );
    }
    let mut seen = HashSet::new();
    let mut entities = registry.entries().to_vec();
    for proposal in payload.proposals {
        if !seen.insert(proposal.entity_id) {
            return Err("duplicate name proposal".into());
        }
        let entity = entities
            .iter_mut()
            .find(|entity| {
                entity.id.get() == proposal.entity_id
                    && entity.chinese == proposal.chinese
                    && entity
                        .occurrences
                        .iter()
                        .all(|o| o.scene_index == proposal.scene_index)
            })
            .ok_or("name proposal has no matching source candidate")?;
        entity.proposal = Some(NameProposal {
            russian: proposal.russian,
            origin: match proposal.origin.as_str() {
                "algorithm" => NameProposalOrigin::Algorithm,
                "model" => NameProposalOrigin::Model,
                _ => {
                    return Err(
                        "experimental proposals require algorithm or model provenance".into(),
                    );
                }
            },
            evidence_id: proposal.evidence_id,
            reviewer_id: None,
        });
        entity.status = NameStatus::NeedsReview;
        entity.revision = new_revision;
    }
    Ok(NameRegistry::new(
        registry.translation_id(),
        registry.source_hash(),
        registry.scene_hash(),
        registry.policy_id().into(),
        new_revision,
        entities,
    )?)
}
