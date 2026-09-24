use super::{ContractError, SegmentId};
use std::collections::HashSet;

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct GlossaryEntry {
    source: String,
    target: String,
    allowed_forms: Vec<String>,
    segment_ids: Option<Vec<SegmentId>>,
}

impl GlossaryEntry {
    pub fn new(
        source: String,
        target: String,
        allowed_forms: Vec<String>,
        segment_ids: Option<Vec<SegmentId>>,
    ) -> Result<Self, ContractError> {
        if !valid_term(&source)
            || !valid_term(&target)
            || allowed_forms.iter().any(|form| !valid_term(form))
            || segment_ids.as_ref().is_some_and(Vec::is_empty)
        {
            return Err(ContractError::InvalidGlossary);
        }
        let mut forms = HashSet::new();
        if allowed_forms.iter().any(|form| !forms.insert(form)) {
            return Err(ContractError::InvalidGlossary);
        }
        if let Some(ids) = &segment_ids {
            let mut seen = HashSet::new();
            if ids.iter().any(|id| !seen.insert(id)) {
                return Err(ContractError::InvalidGlossary);
            }
        }
        Ok(Self {
            source,
            target,
            allowed_forms,
            segment_ids,
        })
    }

    pub fn source(&self) -> &str {
        &self.source
    }

    pub fn target(&self) -> &str {
        &self.target
    }

    pub fn allowed_forms(&self) -> &[String] {
        &self.allowed_forms
    }

    pub fn segment_ids(&self) -> Option<&[SegmentId]> {
        self.segment_ids.as_deref()
    }

    pub(crate) fn applies_to(&self, ids: &[SegmentId]) -> bool {
        self.segment_ids
            .as_ref()
            .is_none_or(|scope| scope.iter().any(|id| ids.contains(id)))
    }
}

fn valid_term(value: &str) -> bool {
    !value.is_empty()
        && value.trim() == value
        && value.chars().any(char::is_alphabetic)
        && !value.chars().any(char::is_control)
}
