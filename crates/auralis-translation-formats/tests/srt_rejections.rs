use auralis_translation_formats::srt::{
    SegmentTranslation, SrtDocument, SrtError, SrtErrorCode, SrtParsePolicy, SrtPolicyError,
};
use auralis_translation_formats::{InspectError, inspect};

const SOURCE: &[u8] = b"1\n00:00:01,000 --> 00:00:02,000\nhello\n\n";

#[test]
fn rejects_unsupported_syntax_before_extraction() {
    let cases: &[(&[u8], SrtErrorCode)] = &[
        (
            b"1\n00:00:01,000 --> 00:00:02,000\n<b>hello</b>\n",
            SrtErrorCode::UnsupportedMarkup,
        ),
        (
            b"1\n00:00:01,000 --> 00:00:02,000\n{\\an8}hello\n",
            SrtErrorCode::UnsupportedMarkup,
        ),
        (
            b"1\n00:00:02,000 --> 00:00:01,000\nhello\n",
            SrtErrorCode::InvalidTiming,
        ),
        (
            b"1\n00:00:01,000 --> 00:00:02,000\n\n",
            SrtErrorCode::MissingText,
        ),
        (
            b"1\n00:00:01,000 --> 00:00:02,000\nhello\r\n",
            SrtErrorCode::InvalidLineEnding,
        ),
        (
            b"1\n00:00:01,000 --> 00:00:02,000\nhello\t\n",
            SrtErrorCode::UnsupportedControl,
        ),
        (
            b"1\n00:00:01,000 --> 00:00:02,000\nhello\n2\n00:00:03,000 --> 00:00:04,000\nworld",
            SrtErrorCode::MissingSeparator,
        ),
        (
            b"1\n00:00:01,000 --> 00:00:02,000\n\xff\n",
            SrtErrorCode::InvalidUtf8,
        ),
    ];
    for (source, expected) in cases {
        assert_eq!(
            error_code(SrtDocument::parse(source)).as_ref(),
            Some(expected),
            "source: {source:?}"
        );
    }
}

#[test]
fn rejects_webvtt_before_srt_parsing() {
    assert!(matches!(
        inspect(b"WEBVTT\n\n"),
        Err(InspectError::UnsupportedFormat)
    ));
}

#[test]
fn rejects_missing_duplicate_and_malformed_translations() -> Result<(), Box<dyn std::error::Error>>
{
    let document = SrtDocument::parse(SOURCE)?;
    let id = document.segments()[0].id;
    assert_eq!(
        error_code(document.render(&[])),
        Some(SrtErrorCode::TranslationIds)
    );
    assert_eq!(
        error_code(document.render(&[
            SegmentTranslation {
                id,
                lines: vec!["one".into()]
            },
            SegmentTranslation {
                id,
                lines: vec!["two".into()]
            },
        ])),
        Some(SrtErrorCode::TranslationIds)
    );
    for lines in [
        vec![],
        vec!["one".into(), "two".into()],
        vec!["bad\nline".into()],
    ] {
        assert_eq!(
            error_code(document.render(&[SegmentTranslation { id, lines }])),
            Some(SrtErrorCode::TranslationLines)
        );
    }
    assert_eq!(
        error_code(document.render(&[SegmentTranslation {
            id,
            lines: vec!["<b>bad</b>".into()]
        }])),
        Some(SrtErrorCode::UnsupportedMarkup)
    );
    Ok(())
}

fn error_code<T>(result: Result<T, SrtError>) -> Option<SrtErrorCode> {
    result.err().map(|error| error.code)
}

#[test]
fn enforces_validated_file_cue_and_line_limits() -> Result<(), Box<dyn std::error::Error>> {
    assert!(matches!(
        SrtParsePolicy::new(0, 1, 1),
        Err(SrtPolicyError::ZeroLimit)
    ));
    assert!(matches!(
        SrtParsePolicy::new(10, 1, 11),
        Err(SrtPolicyError::LineLimitExceedsFileLimit)
    ));
    let small_file = SrtParsePolicy::new(10, 1, 10)?;
    assert_eq!(
        error_code(SrtDocument::parse_with_policy(SOURCE, small_file)),
        Some(SrtErrorCode::FileTooLarge)
    );

    let one_cue = SrtParsePolicy::new(1000, 1, 64)?;
    let two_cues = b"1\n00:00:01,000 --> 00:00:02,000\na\n\n2\n00:00:03,000 --> 00:00:04,000\nb\n";
    assert_eq!(
        error_code(SrtDocument::parse_with_policy(two_cues, one_cue)),
        Some(SrtErrorCode::TooManyCues)
    );

    let short_line = SrtParsePolicy::new(1000, 10, 29)?;
    let long_text = b"1\n00:00:01,000 --> 00:00:02,000\n123456789012345678901234567890\n";
    assert_eq!(
        error_code(SrtDocument::parse_with_policy(long_text, short_line)),
        Some(SrtErrorCode::LineTooLong)
    );
    Ok(())
}
