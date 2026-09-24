use serde::Deserialize;

#[derive(Deserialize)]
pub(crate) struct ChatMessage {
    pub content: Option<String>,
}
