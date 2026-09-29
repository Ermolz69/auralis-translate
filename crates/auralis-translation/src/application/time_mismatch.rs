pub fn source_time_mismatch(source: &str, candidate: &str) -> bool {
    let mut source_times = clock_times(source);
    let mut candidate_times = clock_times(candidate);
    source_times.sort_unstable();
    candidate_times.sort_unstable();
    source_times != candidate_times
}

fn clock_times(text: &str) -> Vec<(u8, u8)> {
    let mut found = Vec::new();
    for (start, first) in text.char_indices() {
        if !first.is_ascii_digit()
            || text[..start]
                .chars()
                .next_back()
                .is_some_and(is_word_character)
        {
            continue;
        }
        let bytes = &text.as_bytes()[start..];
        let hour_digits = if bytes.get(1).is_some_and(u8::is_ascii_digit) {
            2
        } else {
            1
        };
        if bytes.get(hour_digits) != Some(&b':')
            || !bytes.get(hour_digits + 1).is_some_and(u8::is_ascii_digit)
            || !bytes.get(hour_digits + 2).is_some_and(u8::is_ascii_digit)
        {
            continue;
        }
        let end = start + hour_digits + 3;
        if text[end..].chars().next().is_some_and(is_word_character) {
            continue;
        }
        let hour = text[start..start + hour_digits].parse::<u8>().ok();
        let minute = text[start + hour_digits + 1..end].parse::<u8>().ok();
        if let (Some(hour @ 0..=23), Some(minute @ 0..=59)) = (hour, minute) {
            found.push((hour, minute));
        }
    }
    found
}

fn is_word_character(character: char) -> bool {
    character.is_ascii_alphanumeric() || character == '_'
}
