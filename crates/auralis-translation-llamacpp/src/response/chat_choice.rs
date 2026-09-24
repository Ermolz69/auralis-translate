use super::chat_message::ChatMessage;
use serde::Deserialize;

#[derive(Deserialize)]
pub(crate) struct ChatChoice {
    pub message: ChatMessage,
    pub finish_reason: Option<String>,
}
