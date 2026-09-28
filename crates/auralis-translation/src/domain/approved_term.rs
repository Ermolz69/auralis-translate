use super::{ContractError, GlossaryEntry, SegmentId};

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ApprovedTerm {
    entry: GlossaryEntry,
    reviewer_id: String,
    evidence_id: String,
}

impl ApprovedTerm {
    pub fn new(
        source: String,
        target: String,
        allowed_forms: Vec<String>,
        segment_ids: Vec<SegmentId>,
        reviewer_id: String,
        evidence_id: String,
    ) -> Result<Self, ContractError> {
        if !valid_id(&reviewer_id) || !valid_id(&evidence_id) {
            return Err(ContractError::InvalidApprovedTerms);
        }
        let entry = GlossaryEntry::new(source, target, allowed_forms, Some(segment_ids))
            .map_err(|_| ContractError::InvalidApprovedTerms)?;
        Ok(Self {
            entry,
            reviewer_id,
            evidence_id,
        })
    }

    pub fn source(&self) -> &str {
        self.entry.source()
    }
    pub fn target(&self) -> &str {
        self.entry.target()
    }
    pub fn allowed_forms(&self) -> &[String] {
        self.entry.allowed_forms()
    }
    pub fn segment_ids(&self) -> &[SegmentId] {
        self.entry.segment_ids().unwrap_or_default()
    }
    pub fn reviewer_id(&self) -> &str {
        &self.reviewer_id
    }
    pub fn evidence_id(&self) -> &str {
        &self.evidence_id
    }
}

fn valid_id(value: &str) -> bool {
    !value.is_empty()
        && value.trim() == value
        && value.len() <= 256
        && !value.chars().any(char::is_control)
}
