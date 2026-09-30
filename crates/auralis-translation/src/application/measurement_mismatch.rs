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
    let mut found = Vec::new();
    let mut cursor = 0;
    while cursor < text.len() {
        let Some(character) = text[cursor..].chars().next() else {
            break;
        };
        if decimal_digit(character).is_none()
            || text[..cursor].chars().next_back().is_some_and(|previous| {
                decimal_digit(previous).is_some()
                    || previous.is_ascii_alphanumeric()
                    || previous == '_'
            })
        {
            cursor += character.len_utf8();
            continue;
        }
        let mut end = cursor;
        let mut quantity = String::new();
        while let Some((digit, length)) = text[end..]
            .chars()
            .next()
            .and_then(|value| decimal_digit(value).map(|digit| (digit, value.len_utf8())))
        {
            quantity.push(digit);
            end += length;
        }
        if let Some(separator) = text[end..].chars().next()
            && matches!(separator, '.' | ',' | '．' | '，')
            && text[end + separator.len_utf8()..]
                .chars()
                .next()
                .and_then(decimal_digit)
                .is_some()
        {
            quantity.push('.');
            end += separator.len_utf8();
            while let Some((digit, length)) = text[end..]
                .chars()
                .next()
                .and_then(|value| decimal_digit(value).map(|digit| (digit, value.len_utf8())))
            {
                quantity.push(digit);
                end += length;
            }
        }
        let Some(negative) = negative_prefix(&text[..cursor].to_lowercase()) else {
            cursor = end;
            continue;
        };
        while text[end..].chars().next().is_some_and(char::is_whitespace) {
            end += text[end..].chars().next().map_or(0, char::len_utf8);
        }
        if let Some((unit, length)) = unit(&text[end..]) {
            found.push((
                format!("{}{quantity}", if negative { "-" } else { "" }),
                unit,
            ));
            cursor = end + length;
        } else {
            cursor = end;
        }
    }
    found
}

fn decimal_digit(character: char) -> Option<char> {
    if character.is_ascii_digit() {
        return Some(character);
    }
    if ('０'..='９').contains(&character) {
        let offset = u8::try_from(character as u32 - '０' as u32).ok()?;
        return Some(char::from(b'0' + offset));
    }
    None
}

fn negative_prefix(prefix: &str) -> Option<bool> {
    let prefix = prefix.trim_end();
    if let Some(sign @ ('-' | '−' | '－')) = prefix.chars().next_back() {
        let before = &prefix[..prefix.len() - sign.len_utf8()];
        if before.chars().next_back().is_some_and(|character| {
            character.is_ascii_alphanumeric()
                || decimal_digit(character).is_some()
                || character == '_'
        }) {
            return None;
        }
        return Some(true);
    }
    if prefix.ends_with(['负', '負']) {
        return Some(true);
    }
    if let Some(before) = prefix.strip_suffix("минус")
        && before
            .chars()
            .next_back()
            .is_none_or(|character| !character.is_alphabetic())
    {
        return Some(true);
    }
    Some(false)
}

fn unit(tail: &str) -> Option<(Unit, usize)> {
    let lower = tail.to_lowercase();
    for (spelling, unit) in [
        ("ватт-час", Unit::WattHour),
        ("ватт·час", Unit::WattHour),
        ("килограмм", Unit::Kilogram),
        ("грамм", Unit::Gram),
        ("ватт", Unit::Watt),
        ("вольт", Unit::Volt),
    ] {
        if let Some(length) = inflected_word(&lower, spelling) {
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
        if spelling == "g" && tail.starts_with('G') {
            continue;
        }
        if let Some(rest) = lower.strip_prefix(spelling)
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
