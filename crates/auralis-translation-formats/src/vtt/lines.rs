use super::{VttError, VttErrorCode, VttParsePolicy};

pub(crate) struct Line<'a> {
    pub text: &'a str,
    pub start: usize,
    pub end: usize,
    pub number: usize,
}

pub(crate) fn scan(source: &[u8], policy: VttParsePolicy) -> Result<Vec<Line<'_>>, VttError> {
    if source.len() > policy.max_bytes() {
        return Err(VttError::document(VttErrorCode::FileTooLarge));
    }
    std::str::from_utf8(source).map_err(|_| VttError::document(VttErrorCode::InvalidUtf8))?;
    let mut lines = Vec::new();
    let mut start = 0;
    let mut expected_crlf = None;
    for (index, byte) in source.iter().enumerate() {
        if *byte != b'\n' {
            continue;
        }
        let crlf = index > start && source[index - 1] == b'\r';
        if expected_crlf.is_some_and(|expected| expected != crlf) {
            return Err(VttError::at(
                VttErrorCode::InvalidLineEnding,
                lines.len() + 1,
            ));
        }
        expected_crlf = Some(crlf);
        let end = if crlf { index - 1 } else { index };
        lines.push(make_line(source, start, end, lines.len() + 1, policy)?);
        start = index + 1;
    }
    if start < source.len() {
        lines.push(make_line(
            source,
            start,
            source.len(),
            lines.len() + 1,
            policy,
        )?);
    }
    Ok(lines)
}

fn make_line(
    source: &[u8],
    start: usize,
    end: usize,
    number: usize,
    policy: VttParsePolicy,
) -> Result<Line<'_>, VttError> {
    if end - start > policy.max_line_bytes() {
        return Err(VttError::at(VttErrorCode::LineTooLong, number));
    }
    let text = std::str::from_utf8(&source[start..end])
        .map_err(|_| VttError::at(VttErrorCode::InvalidUtf8, number))?;
    if text.contains('\r') {
        return Err(VttError::at(VttErrorCode::InvalidLineEnding, number));
    }
    Ok(Line {
        text,
        start,
        end,
        number,
    })
}
