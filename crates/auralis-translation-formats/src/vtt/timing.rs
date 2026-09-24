const ARROW: &str = " --> ";

pub(crate) fn parse(text: &str) -> Option<(u64, u64)> {
    let (start, end) = text.split_once(ARROW)?;
    let start_ms = timestamp(start)?;
    let end_ms = timestamp(end)?;
    (start_ms < end_ms).then_some((start_ms, end_ms))
}

fn timestamp(text: &str) -> Option<u64> {
    let (clock, fraction) = text.split_once('.')?;
    if fraction.len() != 3 || !fraction.bytes().all(|byte| byte.is_ascii_digit()) {
        return None;
    }
    let fields = clock.split(':').collect::<Vec<_>>();
    let (hours, minutes, seconds) = match fields.as_slice() {
        [minutes, seconds] => (0, two_digits(minutes)?, two_digits(seconds)?),
        [hours, minutes, seconds]
            if hours.len() >= 2 && hours.bytes().all(|byte| byte.is_ascii_digit()) =>
        {
            (
                hours.parse::<u64>().ok()?,
                two_digits(minutes)?,
                two_digits(seconds)?,
            )
        }
        _ => return None,
    };
    if minutes >= 60 || seconds >= 60 {
        return None;
    }
    hours
        .checked_mul(60)?
        .checked_add(minutes)?
        .checked_mul(60)?
        .checked_add(seconds)?
        .checked_mul(1000)?
        .checked_add(fraction.parse::<u64>().ok()?)
}

fn two_digits(text: &str) -> Option<u64> {
    (text.len() == 2 && text.bytes().all(|byte| byte.is_ascii_digit()))
        .then(|| text.parse::<u64>().ok())
        .flatten()
}
