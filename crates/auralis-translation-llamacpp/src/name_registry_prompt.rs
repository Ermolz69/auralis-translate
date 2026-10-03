use auralis_translation::{NameEntity, NameProposalOrigin, NameStatus, ProviderError};
use serde_json::{Value, json};
use sha2::{Digest, Sha256};

const INPUT_MARKER: &str = "Input JSON:\n";

pub fn name_registry_policy_sha256() -> String {
    let source = include_str!("name_registry_prompt.rs").replace("\r\n", "\n");
    let mut hash = Sha256::new();
    hash.update(source.as_bytes());
    hash.update(crate::contextual_prompt_v8::template_sha256().as_bytes());
    format!("{:x}", hash.finalize())
}

pub fn render_v8_name_proposals(
    baseline: &str,
    entities: &[NameEntity],
    max_entries: usize,
    max_bytes: usize,
) -> Result<String, ProviderError> {
    let invalid = || ProviderError::Permanent("invalid v8 name registry envelope".into());
    let (instruction, payload) = baseline.split_once(INPUT_MARKER).ok_or_else(invalid)?;
    let mut envelope: Value = serde_json::from_str(payload).map_err(|_| invalid())?;
    if envelope["schema_version"] != 7 {
        return Err(invalid());
    }
    let slots = envelope["target_slots"]
        .as_array_mut()
        .ok_or_else(invalid)?;
    let mut selected = 0;
    let mut bytes = 0;
    for slot in slots.iter_mut() {
        let id = slot["segment_id"].as_u64().ok_or_else(invalid)?;
        let line_index = slot["line_index"].as_u64().ok_or_else(invalid)?;
        let source = slot["source_original"].as_str().ok_or_else(invalid)?;
        let hints = entities
            .iter()
            .filter_map(|entity| {
                let proposal = entity.proposal.as_ref()?;
                let occurrences = entity
                    .occurrences
                    .iter()
                    .filter(|o| {
                        u64::from(o.segment_id.get()) == id
                            && o.line_index as u64 == line_index
                            && source.get(o.bytes.clone()) == Some(o.surface.as_str())
                    })
                    .map(|o| json!({"byte_start":o.bytes.start,"byte_end":o.bytes.end}))
                    .collect::<Vec<_>>();
                if occurrences.is_empty() {
                    return None;
                }
                Some(
                    json!({"entity_id": entity.id.get(), "source":entity.chinese,
                "russian_proposal": proposal.russian,
                "origin": match proposal.origin { NameProposalOrigin::Algorithm => "algorithm",
                    NameProposalOrigin::Model => "model", NameProposalOrigin::Human => "human" },
                "status": match entity.status { NameStatus::Candidate => "candidate",
                    NameStatus::NeedsReview => "needs_review", NameStatus::Approved => "approved" },
                "revision": entity.revision.get(), "occurrences":occurrences}),
                )
            })
            .collect::<Vec<_>>();
        selected += hints.len();
        bytes += serde_json::to_vec(&hints).map_err(|_| invalid())?.len();
        if !hints.is_empty() {
            slot["name_proposals"] = json!(hints);
        }
    }
    if selected == 0 {
        return Ok(baseline.into());
    }
    if selected > max_entries || bytes > max_bytes {
        return Err(ProviderError::Permanent(
            "target name proposals exceed profile limits".into(),
        ));
    }
    let targets = serde_json::to_string(&envelope["target_slots"]).map_err(|_| invalid())?;
    let context = serde_json::to_string(&envelope["source_context"]).map_err(|_| invalid())?;
    Ok(format!(
        "{instruction}A slot's name_proposals are provisional spellings for the exact source occurrences in that slot; preserve the person and address meaning, allow Russian inflection, and never transfer a name from context or another slot. They do not establish alias identity or human approval. {INPUT_MARKER}{{\"schema_version\":7,\"target_slots\":{targets},\"source_context\":{context}}}"
    ))
}
