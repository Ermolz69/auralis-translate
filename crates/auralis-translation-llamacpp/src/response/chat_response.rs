use super::chat_choice::ChatChoice;
use serde::Deserialize;

#[derive(Deserialize)]
pub(crate) struct ChatResponse {
    pub choices: Vec<ChatChoice>,
}
