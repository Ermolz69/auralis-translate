use auralis_translation::ProviderError;

pub(crate) fn is_length_limited_wrapper_tail(content: &str) -> bool {
    let Some((_, suffix)) = content.rsplit_once('」') else {
        return false;
    };
    let closers = suffix
        .chars()
        .filter(|character| !character.is_whitespace())
        .collect::<String>();
    let closers = closers.strip_prefix('"').unwrap_or(&closers);
    content.contains("\"translations\"")
        && content.contains("\"text\"")
        && closers.len() >= 3
        && closers.starts_with('}')
        && closers.contains(']')
        && closers
            .chars()
            .all(|character| matches!(character, '}' | ']'))
}

pub(crate) fn reject_leaked_json_tail(
    text: String,
    retry_json_tail_once: bool,
) -> Result<String, ProviderError> {
    let Some((_, suffix)) = text.trim_end().rsplit_once('」') else {
        return Ok(text);
    };
    let closers = suffix
        .chars()
        .filter(|character| !character.is_whitespace())
        .collect::<String>();
    if closers.len() >= 3
        && closers.starts_with('}')
        && closers.contains(']')
        && closers
            .chars()
            .all(|character| matches!(character, '}' | ']'))
    {
        let message = "model text contains leaked JSON wrapper tail".into();
        if retry_json_tail_once {
            Err(ProviderError::Transient(message))
        } else {
            Err(ProviderError::Permanent(message))
        }
    } else {
        Ok(text)
    }
}
