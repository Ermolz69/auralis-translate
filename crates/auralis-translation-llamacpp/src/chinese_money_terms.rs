use crate::chinese_number::hundredths;

pub(crate) struct MoneyTerm {
    pub start: usize,
    pub end: usize,
    pub target: String,
}

pub(crate) fn extract(source: &str) -> Vec<MoneyTerm> {
    let chars: Vec<char> = source.chars().collect();
    let mut terms = Vec::new();
    let mut start = 0;
    while start < chars.len() {
        let end = number_end(&chars, start);
        if end == start {
            start += 1;
            continue;
        }
        if start > 0
            && (matches!(chars[start - 1], '-' | '−' | '负' | '万' | '亿' | '点')
                || chars[start - 1].is_ascii_alphanumeric())
        {
            start = end;
            continue;
        }
        let Some(mut amount) = hundredths(&chars[start..end]) else {
            start = end;
            continue;
        };
        let tail: String = chars[end..].iter().collect();
        let Some((unit, forms, scale)) = currency(&tail) else {
            start = end;
            continue;
        };
        let mut finish = end + unit.chars().count();
        if matches!(unit, "块" | "毛" | "角" | "分")
            && !monetary_context(&chars, start, finish, unit)
        {
            start = finish;
            continue;
        }
        if amount % scale != 0 {
            start = finish;
            continue;
        }
        amount /= scale;
        if matches!(unit, "元" | "块" | "块钱" | "人民币") {
            if let Some((fraction, next)) = fraction(&chars, finish) {
                let Some(combined) = amount.checked_add(fraction) else {
                    start = next;
                    continue;
                };
                amount = combined;
                finish = next;
            } else if number_end(&chars, finish) > finish {
                start = number_end(&chars, finish);
                continue;
            }
        }
        let target = format!("{} {}", decimal(amount), inflect(amount, forms));
        terms.push(MoneyTerm {
            start,
            end: finish,
            target,
        });
        start = finish;
    }
    terms
}

fn number_end(chars: &[char], start: usize) -> usize {
    let mut end = start;
    while chars
        .get(end)
        .is_some_and(|ch| ch.is_ascii_digit() || "零〇一二两三四五六七八九十百千.".contains(*ch))
    {
        end += 1;
    }
    end
}

type Currency = (&'static str, [&'static str; 3], u64);

fn currency(tail: &str) -> Option<Currency> {
    [
        ("美元", ["доллар", "доллара", "долларов"], 1),
        ("欧元", ["евро", "евро", "евро"], 1),
        ("日元", ["иена", "иены", "иен"], 1),
        ("卢布", ["рубль", "рубля", "рублей"], 1),
        ("谢克尔", ["шекель", "шекеля", "шекелей"], 1),
        ("先令", ["шиллинг", "шиллинга", "шиллингов"], 1),
        (
            "港元",
            [
                "гонконгский доллар",
                "гонконгских доллара",
                "гонконгских долларов",
            ],
            1,
        ),
        ("人民币", ["юань", "юаня", "юаней"], 1),
        ("元", ["юань", "юаня", "юаней"], 1),
        ("块钱", ["юань", "юаня", "юаней"], 1),
        ("块", ["юань", "юаня", "юаней"], 1),
        ("毛钱", ["юань", "юаня", "юаней"], 10),
        ("毛", ["юань", "юаня", "юаней"], 10),
        ("角", ["юань", "юаня", "юаней"], 10),
        ("分", ["юань", "юаня", "юаней"], 100),
    ]
    .into_iter()
    .find(|(unit, _, _)| tail.starts_with(unit))
}

fn monetary_context(chars: &[char], start: usize, finish: usize, unit: &str) -> bool {
    let boundary = |ch: &char| "，。！？；,!?;".contains(*ch);
    let left = chars[..start]
        .iter()
        .rposition(boundary)
        .map_or(0, |i| i + 1);
    let right = chars[finish..]
        .iter()
        .position(boundary)
        .map_or(chars.len(), |i| finish + i);
    let clause: String = chars[left..right].iter().collect();
    let clue = [
        "钱", "价格", "价", "一共", "找你", "付", "还剩", "花", "买", "卖", "水", "茶", "票", "书",
        "衣服",
    ]
    .iter()
    .any(|word| clause.contains(word));
    let tail: String = chars[finish..right].iter().collect();
    let ends_amount =
        tail.is_empty() || tail.starts_with('钱') || number_end(chars, finish) > finish;
    clue && ends_amount && !(unit == "分" && tail.starts_with('钟'))
}

fn fraction(chars: &[char], start: usize) -> Option<(u64, usize)> {
    let end = number_end(chars, start);
    let value = hundredths(&chars[start..end])?;
    if value % 100 != 0 || value >= 1000 {
        return None;
    }
    match chars.get(end) {
        Some('角' | '毛') => {
            let next = end + 1;
            let cents_end = number_end(chars, next);
            if let Some(cents) = hundredths(&chars[next..cents_end])
                && cents % 100 == 0
                && cents < 1000
                && chars.get(cents_end) == Some(&'分')
            {
                return Some((value / 10 + cents / 100, cents_end + 1));
            }
            Some((value / 10, next))
        }
        Some('分') => Some((value / 100, end + 1)),
        None => Some((value / 10, end)),
        Some(ch) if "，。！？；,!?;".contains(*ch) => Some((value / 10, end)),
        _ => None,
    }
}

fn decimal(value: u64) -> String {
    let whole = value / 100;
    match value % 100 {
        0 => whole.to_string(),
        fraction if fraction % 10 == 0 => format!("{whole},{}", fraction / 10),
        fraction => format!("{whole},{fraction:02}"),
    }
}

fn inflect(value: u64, forms: [&'static str; 3]) -> &'static str {
    if !value.is_multiple_of(100) {
        return forms[1];
    }
    let whole = value / 100;
    if (11..=14).contains(&(whole % 100)) {
        forms[2]
    } else {
        match whole % 10 {
            1 => forms[0],
            2..=4 => forms[1],
            _ => forms[2],
        }
    }
}
