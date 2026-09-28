use super::{ApprovedTerm, ContractError, SegmentId, SourceSegment};
use std::collections::{HashMap, HashSet};

#[derive(Clone, Debug)]
pub struct ApprovedTerms {
    entries: Vec<ApprovedTerm>,
}

impl ApprovedTerms {
    pub fn new(entries: Vec<ApprovedTerm>) -> Result<Self, ContractError> {
        if entries.is_empty() {
            return Err(ContractError::InvalidApprovedTerms);
        }
        let mut scopes: HashMap<&str, HashSet<SegmentId>> = HashMap::new();
        for entry in &entries {
            let known = scopes.entry(entry.source()).or_default();
            if entry.segment_ids().iter().any(|id| !known.insert(*id)) {
                return Err(ContractError::ApprovedTermsConflict);
            }
        }
        Ok(Self { entries })
    }

    pub fn entries(&self) -> &[ApprovedTerm] {
        &self.entries
    }

    pub fn validate_against(&self, segments: &[SourceSegment]) -> Result<(), ContractError> {
        let by_id = segments
            .iter()
            .map(|segment| (segment.id(), segment))
            .collect::<HashMap<_, _>>();
        for entry in &self.entries {
            for id in entry.segment_ids() {
                let Some(segment) = by_id.get(id) else {
                    return Err(ContractError::InvalidApprovedTerms);
                };
                if !segment
                    .lines()
                    .iter()
                    .any(|line| line.contains(entry.source()))
                {
                    return Err(ContractError::InvalidApprovedTerms);
                }
            }
        }
        Ok(())
    }

    pub fn applicable(&self, targets: &[SourceSegment]) -> Vec<ApprovedTerm> {
        self.entries
            .iter()
            .filter(|entry| {
                targets.iter().any(|target| {
                    entry.segment_ids().contains(&target.id())
                        && target
                            .lines()
                            .iter()
                            .any(|line| line.contains(entry.source()))
                })
            })
            .cloned()
            .collect()
    }
}
