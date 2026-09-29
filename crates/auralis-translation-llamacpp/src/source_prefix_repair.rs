use auralis_translation::{source_identifier_mismatch, source_identifiers};

const MAX_PREFIX_CHARACTERS: usize = 80;

pub(crate) fn apply(source: &str, candidate: String) -> (String, bool) {
    if !source_identifier_mismatch(source, &candidate) {
        return (candidate, false);
    }
    let expected = source_identifiers(source);
    if expected.len() != 1
        || !source_identifiers(&candidate).is_empty()
        || has_cyrillic_code_like(&candidate)
        || candidate.trim().is_empty()
    {
        return (candidate, false);
    }
    let Some(colon) = source.find('：') else {
        return (candidate, false);
    };
    let before = &source[..colon];
    if before.chars().count() > MAX_PREFIX_CHARACTERS
        || before.contains(['\r', '\n'])
        || source_identifiers(&source[..colon + '：'.len_utf8()]) != expected
    {
        return (candidate, false);
    }
    (format!("{}: {candidate}", expected[0]), true)
}

fn has_cyrillic_code_like(text: &str) -> bool {
    let characters = text.chars().collect::<Vec<_>>();
    for start in 0..characters.len() {
        if !is_upper_cyrillic(characters[start]) {
            continue;
        }
        let mut cursor = start;
        while characters
            .get(cursor)
            .is_some_and(|value| is_upper_cyrillic(*value))
        {
            cursor += 1;
        }
        if cursor - start < 2 || characters.get(cursor) != Some(&'-') {
            continue;
        }
        cursor += 1;
        let mut digits = 0;
        while characters.get(cursor).is_some_and(char::is_ascii_digit) {
            digits += 1;
            cursor += 1;
        }
        if digits >= 2 {
            return true;
        }
    }
    false
}

fn is_upper_cyrillic(value: char) -> bool {
    ('А'..='Я').contains(&value) || value == 'Ё'
}
