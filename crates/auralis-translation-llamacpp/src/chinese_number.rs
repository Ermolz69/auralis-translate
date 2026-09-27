pub(crate) fn hundredths(chars: &[char]) -> Option<u64> {
    if chars.is_empty() {
        return None;
    }
    if chars.iter().all(|ch| ch.is_ascii_digit() || *ch == '.') {
        let text: String = chars.iter().collect();
        let mut parts = text.split('.');
        let whole: u64 = parts.next()?.parse().ok()?;
        let fraction = match parts.next() {
            None => 0,
            Some(part) if part.len() == 1 => part.parse::<u64>().ok()? * 10,
            Some(part) if part.len() == 2 => part.parse().ok()?,
            _ => return None,
        };
        if parts.next().is_some() {
            return None;
        }
        return whole.checked_mul(100)?.checked_add(fraction);
    }
    let mut sum = 0_u64;
    let mut pending = None;
    let mut previous_unit = 10_000;
    let mut gap_zero = false;
    for ch in chars {
        if let Some(digit) = "零一二三四五六七八九"
            .chars()
            .position(|value| value == *ch)
        {
            if pending.is_some_and(|value| value != 0) {
                return None;
            }
            pending = Some(digit as u64);
            gap_zero |= digit == 0;
        } else if matches!(ch, '两' | '〇') {
            if pending.is_some_and(|value| value != 0) {
                return None;
            }
            pending = Some(if *ch == '两' { 2 } else { 0 });
            gap_zero |= *ch == '〇';
        } else {
            let unit = match ch {
                '十' => 10,
                '百' => 100,
                '千' => 1000,
                _ => return None,
            };
            if unit >= previous_unit || (pending.is_none() && !(sum == 0 && unit == 10)) {
                return None;
            }
            sum += pending.take().unwrap_or(1) * unit;
            previous_unit = unit;
            gap_zero = false;
        }
    }
    if previous_unit > 10
        && previous_unit != 10_000
        && !gap_zero
        && pending.is_some_and(|value| value > 0)
    {
        return None;
    }
    (sum + pending.unwrap_or(0)).checked_mul(100)
}
