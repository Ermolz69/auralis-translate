use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub(crate) struct ManualTranslation {
    pub id: u32,
    pub lines: Vec<String>,
}
