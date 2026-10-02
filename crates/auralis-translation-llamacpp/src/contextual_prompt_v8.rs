use crate::contextual_prompt_v7::{self, ContextLine, Slot};
use auralis_translation::{ApprovedTerm, ProviderError};
use serde_json::Value;
use sha2::{Digest, Sha256};

const INPUT_MARKER: &str = "Input JSON:\n";

pub(crate) fn template_sha256() -> String {
    let source = include_str!("contextual_prompt_v8.rs").replace("\r\n", "\n");
    let inherited = contextual_prompt_v7::template_sha256();
    let mut hash = Sha256::new();
    hash.update(source.as_bytes());
    hash.update(inherited.as_bytes());
    format!("{:x}", hash.finalize())
}

pub(crate) fn render(
    slots: &[Slot<'_>],
    context: &[ContextLine<'_>],
    approved_terms: &[ApprovedTerm],
) -> Result<String, ProviderError> {
    let baseline = contextual_prompt_v7::render(slots, context, approved_terms);
    let (instruction, payload) = baseline.split_once(INPUT_MARKER).ok_or_else(|| {
        ProviderError::Permanent("v8 inherited prompt has no input marker".into())
    })?;
    let envelope: Value = serde_json::from_str(payload)
        .map_err(|_| ProviderError::Permanent("v8 inherited prompt JSON is invalid".into()))?;
    if envelope["schema_version"] != 7 {
        return Err(ProviderError::Permanent(
            "v8 inherited prompt schema differs".into(),
        ));
    }
    let targets = serde_json::to_string(&envelope["target_slots"])
        .map_err(|_| ProviderError::Permanent("v8 target slots cannot be serialized".into()))?;
    let source_context = serde_json::to_string(&envelope["source_context"])
        .map_err(|_| ProviderError::Permanent("v8 source context cannot be serialized".into()))?;
    Ok(format!(
        "{instruction}{INPUT_MARKER}{{\"schema_version\":7,\"target_slots\":{targets},\"source_context\":{source_context}}}"
    ))
}
