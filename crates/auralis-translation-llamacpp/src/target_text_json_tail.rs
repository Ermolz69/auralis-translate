use auralis_translation::ProviderError;

pub(crate) fn reject_leaked_json_tail(text: String) -> Result<String, ProviderError> {
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
        Err(ProviderError::Permanent(
            "model text contains leaked JSON wrapper tail".into(),
        ))
    } else {
        Ok(text)
    }
}
