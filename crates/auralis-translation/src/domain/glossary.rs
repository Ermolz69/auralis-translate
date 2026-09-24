use super::{ContractError, GlossaryEntry, SourceSegment};
use std::collections::{HashMap, HashSet};

#[derive(Clone, Debug)]
pub struct Glossary {
    entries: Vec<GlossaryEntry>,
}

impl Glossary {
    pub fn new(entries: Vec<GlossaryEntry>) -> Result<Self, ContractError> {
        Self::validate_entries(&entries)?;
        Ok(Self { entries })
    }

    pub(crate) fn validate_entries(entries: &[GlossaryEntry]) -> Result<(), ContractError> {
        let mut scopes: HashMap<&str, (bool, HashSet<_>)> = HashMap::new();
        for entry in entries {
            let (global, ids) = scopes.entry(entry.source()).or_default();
            match entry.segment_ids() {
                None if *global || !ids.is_empty() => return Err(ContractError::GlossaryConflict),
                None => *global = true,
                Some(_) if *global => return Err(ContractError::GlossaryConflict),
                Some(scope) => {
                    if scope.iter().any(|id| !ids.insert(*id)) {
                        return Err(ContractError::GlossaryConflict);
                    }
                }
            }
        }
        Ok(())
    }

    pub fn entries(&self) -> &[GlossaryEntry] {
        &self.entries
    }

    pub fn applicable(
        &self,
        targets: &[SourceSegment],
        context: &[SourceSegment],
    ) -> Vec<GlossaryEntry> {
        let ids = targets.iter().map(SourceSegment::id).collect::<Vec<_>>();
        self.entries
            .iter()
            .filter(|entry| {
                entry.applies_to(&ids)
                    && targets
                        .iter()
                        .chain(context)
                        .flat_map(SourceSegment::lines)
                        .any(|line| line.contains(entry.source()))
            })
            .cloned()
            .collect()
    }
}
