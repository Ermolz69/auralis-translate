use super::{NameEntity, NameProposalOrigin, NameStatus};
use crate::{ContractError, SceneMap, SourceHash, SourceSegment, TranslationId};
use std::collections::HashSet;
use std::num::NonZeroU32;

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct NameRegistry {
    translation_id: TranslationId,
    source_hash: SourceHash,
    scene_hash: SourceHash,
    policy_id: String,
    revision: NonZeroU32,
    entries: Vec<NameEntity>,
}

impl NameRegistry {
    pub fn new(
        translation_id: TranslationId,
        source_hash: SourceHash,
        scene_hash: SourceHash,
        policy_id: String,
        revision: NonZeroU32,
        entries: Vec<NameEntity>,
    ) -> Result<Self, ContractError> {
        let mut ids = HashSet::new();
        if !valid_text(&policy_id)
            || entries.iter().any(|entity| {
                !ids.insert(entity.id)
                    || !valid_text(&entity.chinese)
                    || entity.revision > revision
                    || entity.occurrences.is_empty()
                    || entity
                        .possible_aliases
                        .iter()
                        .any(|alias| !valid_text(alias))
                    || entity.occurrences.iter().any(|occurrence| {
                        occurrence.bytes.start >= occurrence.bytes.end
                            || occurrence.surface != entity.chinese
                    })
                    || entity.proposal.as_ref().is_some_and(|proposal| {
                        !valid_text(&proposal.russian)
                            || !valid_text(&proposal.evidence_id)
                            || proposal
                                .reviewer_id
                                .as_ref()
                                .is_some_and(|id| !valid_text(id))
                    })
                    || (entity.status == NameStatus::Approved
                        && entity.proposal.as_ref().is_none_or(|proposal| {
                            proposal.origin != NameProposalOrigin::Human
                                || proposal.reviewer_id.is_none()
                        }))
            })
        {
            return Err(ContractError::InvalidNameRegistry);
        }
        Ok(Self {
            translation_id,
            source_hash,
            scene_hash,
            policy_id,
            revision,
            entries,
        })
    }

    pub fn validate_against(
        &self,
        segments: &[SourceSegment],
        scenes: &SceneMap,
    ) -> Result<(), ContractError> {
        if !scenes.matches(segments) || scenes.fingerprint() != self.scene_hash {
            return Err(ContractError::InvalidNameRegistry);
        }
        let mut occupied = HashSet::new();
        for entity in &self.entries {
            for occurrence in &entity.occurrences {
                let Some(scene) = scenes.ranges().get(occurrence.scene_index) else {
                    return Err(ContractError::InvalidNameRegistry);
                };
                let Some(segment) = segments[scene.clone()]
                    .iter()
                    .find(|segment| segment.id() == occurrence.segment_id)
                else {
                    return Err(ContractError::InvalidNameRegistry);
                };
                if segment
                    .lines()
                    .get(occurrence.line_index)
                    .and_then(|line| line.get(occurrence.bytes.clone()))
                    != Some(occurrence.surface.as_str())
                    || !occupied.insert((
                        occurrence.segment_id,
                        occurrence.line_index,
                        occurrence.bytes.start,
                        occurrence.bytes.end,
                    ))
                {
                    return Err(ContractError::InvalidNameRegistry);
                }
            }
        }
        Ok(())
    }

    pub fn translation_id(&self) -> TranslationId {
        self.translation_id
    }
    pub fn source_hash(&self) -> SourceHash {
        self.source_hash
    }
    pub fn scene_hash(&self) -> SourceHash {
        self.scene_hash
    }
    pub fn policy_id(&self) -> &str {
        &self.policy_id
    }
    pub fn revision(&self) -> NonZeroU32 {
        self.revision
    }
    pub fn entries(&self) -> &[NameEntity] {
        &self.entries
    }

    pub fn applicable(&self, targets: &[SourceSegment]) -> Vec<NameEntity> {
        self.entries
            .iter()
            .filter_map(|entity| {
                entity.proposal.as_ref()?;
                let occurrences = entity
                    .occurrences
                    .iter()
                    .filter(|occurrence| {
                        targets.iter().any(|target| {
                            target.id() == occurrence.segment_id
                                && target
                                    .lines()
                                    .get(occurrence.line_index)
                                    .and_then(|line| line.get(occurrence.bytes.clone()))
                                    == Some(occurrence.surface.as_str())
                        })
                    })
                    .cloned()
                    .collect::<Vec<_>>();
                if occurrences.is_empty() {
                    return None;
                }
                let mut selected = entity.clone();
                selected.occurrences = occurrences;
                Some(selected)
            })
            .collect()
    }

    pub fn fingerprint(&self) -> SourceHash {
        let mut bytes = b"source-name-registry-v1".to_vec();
        bytes.extend(self.translation_id.get().as_bytes());
        bytes.extend(self.source_hash.bytes());
        bytes.extend(self.scene_hash.bytes());
        bytes.extend(self.revision.get().to_le_bytes());
        hash_text(&mut bytes, &self.policy_id);
        bytes.extend((self.entries.len() as u64).to_le_bytes());
        for entity in &self.entries {
            bytes.extend(entity.id.get().to_le_bytes());
            bytes.extend(entity.revision.get().to_le_bytes());
            hash_text(&mut bytes, &entity.chinese);
            bytes.push(match entity.status {
                NameStatus::Candidate => 0,
                NameStatus::NeedsReview => 1,
                NameStatus::Approved => 2,
            });
            bytes.extend((entity.possible_aliases.len() as u64).to_le_bytes());
            for alias in &entity.possible_aliases {
                hash_text(&mut bytes, alias);
            }
            bytes.extend((entity.occurrences.len() as u64).to_le_bytes());
            for occurrence in &entity.occurrences {
                bytes.extend(occurrence.segment_id.get().to_le_bytes());
                bytes.extend((occurrence.line_index as u64).to_le_bytes());
                bytes.extend((occurrence.scene_index as u64).to_le_bytes());
                bytes.extend((occurrence.bytes.start as u64).to_le_bytes());
                bytes.extend((occurrence.bytes.end as u64).to_le_bytes());
                hash_text(&mut bytes, &occurrence.surface);
            }
            if let Some(proposal) = &entity.proposal {
                bytes.push(1);
                hash_text(&mut bytes, &proposal.russian);
                bytes.push(match proposal.origin {
                    NameProposalOrigin::Algorithm => 0,
                    NameProposalOrigin::Model => 1,
                    NameProposalOrigin::Human => 2,
                });
                hash_text(&mut bytes, &proposal.evidence_id);
                bytes.push(u8::from(proposal.reviewer_id.is_some()));
                hash_text(
                    &mut bytes,
                    proposal.reviewer_id.as_deref().unwrap_or_default(),
                );
            } else {
                bytes.push(0);
            }
        }
        SourceHash::digest(&bytes)
    }
}

fn hash_text(bytes: &mut Vec<u8>, text: &str) {
    bytes.extend((text.len() as u64).to_le_bytes());
    bytes.extend(text.as_bytes());
}
fn valid_text(text: &str) -> bool {
    !text.is_empty() && text.trim() == text && !text.chars().any(char::is_control)
}
