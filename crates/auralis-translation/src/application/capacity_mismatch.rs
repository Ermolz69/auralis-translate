#[derive(Clone, Debug, Eq, Ord, PartialEq, PartialOrd)]
struct Capacity {
    value: String,
    bare_g: bool,
}

pub fn source_capacity_mismatch(source: &str, candidate: &str) -> bool {
    let mut source_values = capacities(source, true);
    let bare_count = source_values.iter().filter(|value| value.bare_g).count();
    let contextual_g = bare_count == 1 && storage_context(source) && !weight_context(source);
    source_values.retain(|value| !value.bare_g || contextual_g);
    if source_values.is_empty() {
        return false;
    }
    let mut candidate_values = capacities(candidate, false)
        .into_iter()
        .map(|value| value.value)
        .collect::<Vec<_>>();
    let mut source_values = source_values
        .into_iter()
        .map(|value| value.value)
        .collect::<Vec<_>>();
    source_values.sort_unstable();
    candidate_values.sort_unstable();
    source_values != candidate_values
}

fn storage_context(source: &str) -> bool {
    ["内存", "显存", "存储", "储存", "容量", "硬盘", "固态"]
        .iter()
        .any(|marker| source.contains(marker))
        || ["LPDDR", "DDR", "SSD"]
            .iter()
            .any(|marker| source.to_ascii_uppercase().contains(marker))
}

fn weight_context(source: &str) -> bool {
    ["重量", "质量", "机重", "重达"]
        .iter()
        .any(|marker| source.contains(marker))
}

fn capacities(text: &str, allow_bare_g: bool) -> Vec<Capacity> {
    let mut found = Vec::new();
    let mut cursor = 0;
    while cursor < text.len() {
        let Some(character) = text[cursor..].chars().next() else {
            break;
        };
        if digit(character).is_none() || in_product_code(&text[..cursor]) {
            cursor += character.len_utf8();
            continue;
        }
        let mut end = cursor;
        let mut value = String::new();
        while let Some((normalized, length)) = text[end..]
            .chars()
            .next()
            .and_then(|character| digit(character).map(|digit| (digit, character.len_utf8())))
        {
            value.push(normalized);
            end += length;
        }
        if let Some(separator) = text[end..].chars().next()
            && matches!(separator, '.' | ',' | '．' | '，')
            && text[end + separator.len_utf8()..]
                .chars()
                .next()
                .and_then(digit)
                .is_some()
        {
            value.push('.');
            end += separator.len_utf8();
            while let Some((normalized, length)) = text[end..]
                .chars()
                .next()
                .and_then(|character| digit(character).map(|digit| (digit, character.len_utf8())))
            {
                value.push(normalized);
                end += length;
            }
            while value.ends_with('0') {
                value.pop();
            }
            if value.ends_with('.') {
                value.pop();
            }
        }
        while text[end..].chars().next().is_some_and(char::is_whitespace) {
            end += text[end..].chars().next().map_or(0, char::len_utf8);
        }
        if let Some((length, bare_g)) = capacity_unit(&text[end..], allow_bare_g) {
            found.push(Capacity { value, bare_g });
            cursor = end + length;
        } else {
            cursor = end;
        }
    }
    found
}

fn digit(character: char) -> Option<char> {
    if character.is_ascii_digit() {
        return Some(character);
    }
    if ('０'..='９').contains(&character) {
        let offset = u8::try_from(character as u32 - '０' as u32).ok()?;
        return Some(char::from(b'0' + offset));
    }
    None
}

fn in_product_code(prefix: &str) -> bool {
    let Some(previous) = prefix.chars().next_back() else {
        return false;
    };
    if previous.is_ascii_alphanumeric() || previous == '_' || digit(previous).is_some() {
        return true;
    }
    matches!(previous, '-' | '－')
        && prefix[..prefix.len() - previous.len_utf8()]
            .chars()
            .next_back()
            .is_some_and(|character| character.is_ascii_alphanumeric() || character == '_')
}

fn capacity_unit(tail: &str, allow_bare_g: bool) -> Option<(usize, bool)> {
    if let Some(rest) = tail.strip_prefix("GB")
        && boundary(rest)
    {
        return Some((2, false));
    }
    let lower = tail.to_lowercase();
    if let Some(rest) = lower.strip_prefix("гб")
        && boundary(rest)
    {
        return Some(("гб".len(), false));
    }
    if let Some(rest) = lower.strip_prefix("гигабайт") {
        for suffix in [
            "ами", "ями", "ов", "ев", "ах", "ях", "ам", "ям", "ом", "ем", "а", "у", "ы", "е", "и",
            "",
        ] {
            if let Some(after) = rest.strip_prefix(suffix)
                && boundary(after)
            {
                return Some(("гигабайт".len() + suffix.len(), false));
            }
        }
    }
    if allow_bare_g
        && let Some(rest) = tail.strip_prefix('G')
        && boundary(rest)
    {
        return Some((1, true));
    }
    None
}

fn boundary(rest: &str) -> bool {
    !rest.chars().next().is_some_and(|character| {
        character.is_ascii_alphanumeric()
            || ('\u{0400}'..='\u{052f}').contains(&character)
            || character == '_'
            || character == '/'
    })
}
