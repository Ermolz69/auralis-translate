#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
enum Unit {
    Gram,
    Kilogram,
    Watt,
    WattHour,
    Volt,
}

pub fn source_measurement_mismatch(source: &str, candidate: &str) -> bool {
    let mut source_values = measurements(source);
    if source_values.is_empty() {
        return false;
    }
    let mut candidate_values = measurements(candidate);
    source_values.sort_unstable();
    candidate_values.sort_unstable();
    source_values != candidate_values
}

fn measurements(text: &str) -> Vec<(String, Unit)> {
    let lower = text.to_lowercase();
    let mut found = Vec::new();
    let mut cursor = 0;
    while cursor < lower.len() {
        let Some(character) = lower[cursor..].chars().next() else {
            break;
        };
        if !character.is_ascii_digit()
            || lower[..cursor]
                .chars()
                .next_back()
                .is_some_and(|previous| previous.is_ascii_alphanumeric() || previous == '_')
        {
            cursor += character.len_utf8();
            continue;
        }
        let bytes = lower.as_bytes();
        let mut end = cursor;
        while bytes.get(end).is_some_and(u8::is_ascii_digit) {
            end += 1;
        }
        if matches!(bytes.get(end), Some(b'.' | b','))
            && bytes.get(end + 1).is_some_and(u8::is_ascii_digit)
        {
            end += 1;
            while bytes.get(end).is_some_and(u8::is_ascii_digit) {
                end += 1;
            }
        }
        let quantity = lower[cursor..end].replace(',', ".");
        while lower[end..].chars().next().is_some_and(char::is_whitespace) {
            end += lower[end..].chars().next().map_or(0, char::len_utf8);
        }
        if let Some((unit, length)) = unit(&lower[end..]) {
            found.push((quantity, unit));
            cursor = end + length;
        } else {
            cursor = end;
        }
    }
    found
}

fn unit(tail: &str) -> Option<(Unit, usize)> {
    for (spelling, unit) in [
        ("ватт-час", Unit::WattHour),
        ("ватт·час", Unit::WattHour),
        ("килограмм", Unit::Kilogram),
        ("грамм", Unit::Gram),
        ("ватт", Unit::Watt),
        ("вольт", Unit::Volt),
    ] {
        if let Some(length) = inflected_word(tail, spelling) {
            return Some((unit, length));
        }
    }
    for (spelling, unit) in [
        ("вт·ч", Unit::WattHour),
        ("вт-ч", Unit::WattHour),
        ("втч", Unit::WattHour),
        ("wh", Unit::WattHour),
        ("千克", Unit::Kilogram),
        ("瓦时", Unit::WattHour),
        ("kg", Unit::Kilogram),
        ("кг", Unit::Kilogram),
        ("вт", Unit::Watt),
        ("克", Unit::Gram),
        ("瓦", Unit::Watt),
        ("伏", Unit::Volt),
        ("g", Unit::Gram),
        ("г", Unit::Gram),
        ("w", Unit::Watt),
        ("v", Unit::Volt),
        ("в", Unit::Volt),
    ] {
        if let Some(rest) = tail.strip_prefix(spelling)
            && !rest.chars().next().is_some_and(|next| {
                next.is_ascii_alphanumeric()
                    || ('\u{0400}'..='\u{052f}').contains(&next)
                    || next == '_'
            })
        {
            return Some((unit, spelling.len()));
        }
    }
    None
}

fn inflected_word(tail: &str, root: &str) -> Option<usize> {
    let rest = tail.strip_prefix(root)?;
    for suffix in [
        "ами", "ями", "ов", "ев", "ах", "ях", "ам", "ям", "ом", "ем", "а", "у", "ы", "е", "и", "",
    ] {
        if let Some(after) = rest.strip_prefix(suffix)
            && !after.chars().next().is_some_and(char::is_alphabetic)
        {
            return Some(root.len() + suffix.len());
        }
    }
    None
}
