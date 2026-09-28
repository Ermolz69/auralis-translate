use crate::response::ChatResponse;
use auralis_translation::ProviderError;

pub(crate) fn decode_chat_response(body: &[u8]) -> Result<String, ProviderError> {
    let parsed: ChatResponse = serde_json::from_slice(body)
        .map_err(|_| ProviderError::Permanent("invalid llama.cpp response JSON".into()))?;
    if parsed.choices.len() != 1 {
        return Err(ProviderError::Permanent(
            "llama.cpp response must have one choice".into(),
        ));
    }
    let choice = parsed
        .choices
        .into_iter()
        .next()
        .ok_or_else(|| ProviderError::Permanent("llama.cpp response has no choice".into()))?;
    if choice.finish_reason.as_deref() != Some("stop") {
        return Err(ProviderError::Permanent(
            "llama.cpp did not finish the response".into(),
        ));
    }
    let content = choice
        .message
        .content
        .ok_or_else(|| ProviderError::Permanent("llama.cpp response has no text".into()))?;
    if content.trim().is_empty() {
        return Err(ProviderError::Permanent(
            "llama.cpp response is empty".into(),
        ));
    }
    Ok(content)
}
