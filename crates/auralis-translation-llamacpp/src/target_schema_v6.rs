use serde_json::{Value, json};
use sha2::{Digest, Sha256};

pub(crate) fn template_sha256() -> String {
    let source = format!(
        "{}\n{}",
        crate::contextual_prompt_v5::template_sha256(),
        include_str!("target_schema_v6.rs").replace("\r\n", "\n")
    );
    format!("{:x}", Sha256::digest(source.as_bytes()))
}

pub(crate) fn response_format(segment_id: u32, line_index: usize) -> Value {
    let mut format = crate::contextual_prompt_v5::response_format();
    let properties = &mut format["schema"]["properties"]["translations"]["items"]["properties"];
    properties["segment_id"] = json!({ "const": segment_id });
    properties["line_index"] = json!({ "const": line_index });
    format
}
