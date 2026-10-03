use auralis_translation::ProviderError;
use serde_json::Value;
use sha2::{Digest, Sha256};

pub fn name_proposal_admission_sha256() -> String {
    let source = include_str!("name_proposal_admission.rs").replace("\r\n", "\n");
    format!("{:x}", Sha256::digest(source.as_bytes()))
}

pub fn check_name_proposal_admission(prompt: &str) -> Result<(), ProviderError> {
    let invalid = || ProviderError::Permanent("invalid name admission envelope".into());
    let (_, input) = prompt.split_once("Input JSON:\n").ok_or_else(invalid)?;
    let envelope: Value = serde_json::from_str(input).map_err(|_| invalid())?;
    let slots = envelope["target_slots"].as_array().ok_or_else(invalid)?;
    for slot in slots {
        if let Some(proposals) = slot.get("name_proposals") {
            let proposals = proposals.as_array().ok_or_else(invalid)?;
            if !proposals.is_empty() {
                let segment = slot["segment_id"].as_u64().ok_or_else(invalid)?;
                let line = slot["line_index"].as_u64().ok_or_else(invalid)?;
                return Err(ProviderError::NameProposalReviewRequired(format!(
                    "name_proposal_review_required: target {segment}:{line} has a name proposal; source-aware identity/action verification is unavailable; candidate rejected before checkpoint"
                )));
            }
        }
    }
    Ok(())
}
