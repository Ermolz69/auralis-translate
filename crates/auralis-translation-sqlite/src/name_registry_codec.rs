use crate::DbError;
use auralis_translation::{
    NameEntity, NameEntityId, NameOccurrence, NameProposal, NameProposalOrigin, NameRegistry,
    NameStatus, SegmentId, SourceHash, TranslationId,
};
use serde::{Deserialize, Serialize};
use std::num::NonZeroU32;

#[derive(Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
struct Payload {
    schema_version: u32,
    translation_id: String,
    source_sha256: String,
    scene_sha256: String,
    policy_id: String,
    revision: u32,
    entities: Vec<Entity>,
}
#[derive(Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
struct Entity {
    id: u32,
    chinese: String,
    possible_aliases: Vec<String>,
    occurrences: Vec<Occurrence>,
    proposal: Option<Proposal>,
    status: String,
    revision: u32,
}
#[derive(Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
struct Occurrence {
    segment_id: u32,
    line_index: usize,
    byte_start: usize,
    byte_end: usize,
    scene_index: usize,
    surface: String,
}
#[derive(Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
struct Proposal {
    russian: String,
    origin: String,
    evidence_id: String,
    reviewer_id: Option<String>,
}

pub(crate) fn encode(registry: &NameRegistry) -> Result<String, DbError> {
    Ok(serde_json::to_string(&Payload {
        schema_version: 1,
        translation_id: registry.translation_id().to_string(),
        source_sha256: registry.source_hash().to_string(),
        scene_sha256: registry.scene_hash().to_string(),
        policy_id: registry.policy_id().into(),
        revision: registry.revision().get(),
        entities: registry
            .entries()
            .iter()
            .map(|entity| Entity {
                id: entity.id.get(),
                chinese: entity.chinese.clone(),
                possible_aliases: entity.possible_aliases.clone(),
                occurrences: entity
                    .occurrences
                    .iter()
                    .map(|o| Occurrence {
                        segment_id: o.segment_id.get(),
                        line_index: o.line_index,
                        byte_start: o.bytes.start,
                        byte_end: o.bytes.end,
                        scene_index: o.scene_index,
                        surface: o.surface.clone(),
                    })
                    .collect(),
                proposal: entity.proposal.as_ref().map(|p| Proposal {
                    russian: p.russian.clone(),
                    origin: match p.origin {
                        NameProposalOrigin::Algorithm => "algorithm",
                        NameProposalOrigin::Model => "model",
                        NameProposalOrigin::Human => "human",
                    }
                    .into(),
                    evidence_id: p.evidence_id.clone(),
                    reviewer_id: p.reviewer_id.clone(),
                }),
                status: match entity.status {
                    NameStatus::Candidate => "candidate",
                    NameStatus::NeedsReview => "needs_review",
                    NameStatus::Approved => "approved",
                }
                .into(),
                revision: entity.revision.get(),
            })
            .collect(),
    })?)
}

pub(crate) fn decode(text: &str) -> Result<NameRegistry, DbError> {
    let payload: Payload = serde_json::from_str(text)?;
    let invalid = || DbError::CorruptRecord("invalid name registry payload");
    if payload.schema_version != 1 {
        return Err(invalid());
    }
    let entities = payload
        .entities
        .into_iter()
        .map(|e| {
            Ok(NameEntity {
                id: NameEntityId::new(e.id).ok_or_else(invalid)?,
                chinese: e.chinese,
                possible_aliases: e.possible_aliases,
                occurrences: e
                    .occurrences
                    .into_iter()
                    .map(|o| {
                        Ok(NameOccurrence {
                            segment_id: SegmentId::new(o.segment_id).ok_or_else(invalid)?,
                            line_index: o.line_index,
                            bytes: o.byte_start..o.byte_end,
                            scene_index: o.scene_index,
                            surface: o.surface,
                        })
                    })
                    .collect::<Result<Vec<_>, DbError>>()?,
                proposal: e
                    .proposal
                    .map(|p| {
                        Ok(NameProposal {
                            russian: p.russian,
                            origin: match p.origin.as_str() {
                                "algorithm" => NameProposalOrigin::Algorithm,
                                "model" => NameProposalOrigin::Model,
                                "human" => NameProposalOrigin::Human,
                                _ => return Err(invalid()),
                            },
                            evidence_id: p.evidence_id,
                            reviewer_id: p.reviewer_id,
                        })
                    })
                    .transpose()?,
                status: match e.status.as_str() {
                    "candidate" => NameStatus::Candidate,
                    "needs_review" => NameStatus::NeedsReview,
                    "approved" => NameStatus::Approved,
                    _ => return Err(invalid()),
                },
                revision: NonZeroU32::new(e.revision).ok_or_else(invalid)?,
            })
        })
        .collect::<Result<Vec<_>, DbError>>()?;
    NameRegistry::new(
        TranslationId::parse(&payload.translation_id).map_err(|_| invalid())?,
        SourceHash::parse_hex(&payload.source_sha256).ok_or_else(invalid)?,
        SourceHash::parse_hex(&payload.scene_sha256).ok_or_else(invalid)?,
        payload.policy_id,
        NonZeroU32::new(payload.revision).ok_or_else(invalid)?,
        entities,
    )
    .map_err(|_| invalid())
}
