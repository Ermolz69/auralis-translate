pub fn source_identifier_mismatch(source: &str, candidate: &str) -> bool {
    let mut source_ids = identifiers(source);
    let mut candidate_ids = identifiers(candidate);
    source_ids.sort_unstable();
    candidate_ids.sort_unstable();
    source_ids != candidate_ids
}

fn identifiers(text: &str) -> Vec<&str> {
    let mut found = Vec::new();
    let mut previous = None;
    for (start, first) in text.char_indices() {
        let is_start = first.is_ascii_uppercase() && !previous.is_some_and(is_word_character);
        previous = Some(first);
        if !is_start {
            continue;
        }
        let bytes = &text.as_bytes()[start..];
        let mut letters = 0;
        while bytes.get(letters).is_some_and(u8::is_ascii_uppercase) {
            letters += 1;
        }
        if letters < 2 || bytes.get(letters) != Some(&b'-') {
            continue;
        }
        let mut digits = 0;
        while bytes
            .get(letters + 1 + digits)
            .is_some_and(u8::is_ascii_digit)
        {
            digits += 1;
        }
        if !(2..=8).contains(&digits) {
            continue;
        }
        let end = start + letters + 1 + digits;
        if text[end..].chars().next().is_some_and(is_word_character) {
            continue;
        }
        found.push(&text[start..end]);
    }
    found
}

fn is_word_character(character: char) -> bool {
    character.is_alphanumeric() || character == '_'
}
