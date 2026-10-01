use crate::response::ChatResponse;
use auralis_translation::ProviderError;

pub(crate) fn decode_chat_response(body: &[u8]) -> Result<String, ProviderError> {
    decode_chat_response_with_tail_retry(body, false)
}

pub(crate) fn decode_chat_response_with_tail_retry(
    body: &[u8],
    retry_length_json_tail_once: bool,
) -> Result<String, ProviderError> {
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
        if retry_length_json_tail_once
            && choice.finish_reason.as_deref() == Some("length")
            && choice
                .message
                .content
                .as_deref()
                .is_some_and(crate::target_text_json_tail::is_length_limited_wrapper_tail)
        {
            return Err(ProviderError::Transient(
                "llama.cpp exhausted output tokens in a leaked JSON wrapper tail".into(),
            ));
        }
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
