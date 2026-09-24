use auralis_translation_formats::vtt::{
    SegmentTranslation, VttDocument, VttErrorCode, VttParsePolicy, VttPolicyError,
};

#[test]
fn extracts_plain_cues_and_preserves_header_notes_ids_timing_and_source()
-> Result<(), Box<dyn std::error::Error>> {
    let source = b"\xef\xbb\xbfWEBVTT\r\n\r\nNOTE provenance\r\nsource one\r\n\r\nscene-1\r\n00:01.000 --> 00:02.500\r\n\xe4\xbd\xa0\xe5\xa5\xbd\xe3\x80\x82\r\n\r\n01:00:03.000 --> 01:00:04.000\r\n\xe5\x86\x8d\xe8\xa7\x81\xe3\x80\x82\r\n\xe6\x98\x8e\xe5\xa4\xa9\xe8\xa7\x81\xe3\x80\x82\r\n";
    let document = VttDocument::parse(source)?;
    assert_eq!(document.segments().len(), 2);
    assert_eq!(document.segments()[0].cue_id.as_deref(), Some("scene-1"));
    assert_eq!(document.segments()[1].cue_id, None);
    assert_eq!(
        (
            document.segments()[0].start_ms,
            document.segments()[0].end_ms
        ),
        (1000, 2500)
    );
    assert_eq!(document.segments()[1].start_ms, 3_603_000);
    assert_eq!(document.source_segments()?.len(), 2);
    assert_eq!(document.render(&document.original_translations())?, source);

    let original = document.source_bytes().to_vec();
    let translations = vec![
        SegmentTranslation {
            id: document.segments()[0].id,
            lines: vec!["Привет.".into()],
        },
        SegmentTranslation {
            id: document.segments()[1].id,
            lines: vec!["Пока.".into(), "До завтра.".into()],
        },
    ];
    let rendered = document.render(&translations)?;
    let reparsed = VttDocument::parse(&rendered)?;
    assert_eq!(document.source_bytes(), original);
    assert_eq!(reparsed.segments()[0].text_slots[0].text, "Привет.");
    assert_eq!(reparsed.segments()[1].text_slots[1].text, "До завтра.");
    let source_chunks = document
        .protected_byte_ranges()
        .into_iter()
        .map(|range| &source[range])
        .collect::<Vec<_>>();
    let output_chunks = reparsed
        .protected_byte_ranges()
        .into_iter()
        .map(|range| &rendered[range])
        .collect::<Vec<_>>();
    assert_eq!(source_chunks, output_chunks);
    Ok(())
}

#[test]
fn roundtrips_supported_line_endings_bom_and_terminal_variants()
-> Result<(), Box<dyn std::error::Error>> {
    for ending in ["\n", "\r\n"] {
        for bom in ["", "\u{feff}"] {
            for terminal in ["", "\n", "\n\n"] {
                let source = format!(
                    "{bom}WEBVTT{ending}{ending}id{ending}00:00.001 --> 00:01.000{ending}你好。{}",
                    terminal.replace('\n', ending)
                );
                let document = VttDocument::parse(source.as_bytes())?;
                assert_eq!(
                    document.render(&document.original_translations())?,
                    source.as_bytes()
                );
            }
        }
    }
    Ok(())
}

#[test]
fn rejects_unsupported_or_ambiguous_input_before_extraction() {
    let cases: &[(&[u8], VttErrorCode)] = &[
        (
            b"WEBVTT - title\n\n00:00.000 --> 00:01.000\nhello",
            VttErrorCode::InvalidHeader,
        ),
        (
            b"WEBVTT\n00:00.000 --> 00:01.000\nhello",
            VttErrorCode::MissingHeaderSeparator,
        ),
        (
            b"WEBVTT\n\nSTYLE\n::cue { color: red }",
            VttErrorCode::UnsupportedFeature,
        ),
        (b"WEBVTT\n\nREGION\nid:a", VttErrorCode::UnsupportedFeature),
        (
            b"WEBVTT\n\n00:00.000 --> 00:01.000 align:start\nhello",
            VttErrorCode::InvalidTiming,
        ),
        (
            b"WEBVTT\n\n00:00.000 --> 00:01.000\n<b>hello</b>",
            VttErrorCode::UnsupportedFeature,
        ),
        (
            b"WEBVTT\n\n00:00.000 --> 00:01.000\nTom &amp; Jerry",
            VttErrorCode::UnsupportedFeature,
        ),
        (
            b"WEBVTT\n\nid\n00:00.000 --> 00:01.000\na\n\nid\n00:01.000 --> 00:02.000\nb",
            VttErrorCode::DuplicateCueId,
        ),
        (
            b"WEBVTT\n\n00:00.000 --> 00:01.000\na\n00:01.000 --> 00:02.000\nb",
            VttErrorCode::MissingSeparator,
        ),
        (
            b"WEBVTT\n\n00:02.000 --> 00:03.000\na\n\n00:01.000 --> 00:02.000\nb",
            VttErrorCode::UnorderedTiming,
        ),
        (
            b"WEBVTT\n\n00:01.000 --> 00:01.000\na",
            VttErrorCode::InvalidTiming,
        ),
        (
            b"WEBVTT\n\n00:00.000 --> 00:01.000\n",
            VttErrorCode::MissingText,
        ),
        (
            b"WEBVTT\r\n\r\n00:00.000 --> 00:01.000\nhello",
            VttErrorCode::InvalidLineEnding,
        ),
        (
            b"WEBVTT\n\n00:00.000 --> 00:01.000\n\xff",
            VttErrorCode::InvalidUtf8,
        ),
        (
            b"WEBVTT\n\nNOTE\n\0\n\n00:00.000 --> 00:01.000\nhello",
            VttErrorCode::UnsupportedControl,
        ),
    ];
    for (source, expected) in cases {
        let code = VttDocument::parse(source).err().map(|error| error.code);
        assert_eq!(code, Some(*expected), "{source:?}");
    }
}

#[test]
fn rejects_missing_duplicate_or_unsafe_translation_lines() -> Result<(), Box<dyn std::error::Error>>
{
    let source = b"WEBVTT\n\n00:00.000 --> 00:01.000\nhello\n\n00:01.000 --> 00:02.000\nbye";
    let document = VttDocument::parse(source)?;
    let mut translations = document.original_translations();
    translations.pop();
    assert_eq!(
        document.render(&translations).err().map(|error| error.code),
        Some(VttErrorCode::TranslationIds)
    );
    let first = document.original_translations()[0].clone();
    assert_eq!(
        document
            .render(&[first.clone(), first])
            .err()
            .map(|error| error.code),
        Some(VttErrorCode::TranslationIds)
    );
    let mut translations = document.original_translations();
    translations[0].lines.push("extra".into());
    assert_eq!(
        document.render(&translations).err().map(|error| error.code),
        Some(VttErrorCode::TranslationLines)
    );
    translations[0].lines = vec!["<b>unsafe</b>".into()];
    assert_eq!(
        document.render(&translations).err().map(|error| error.code),
        Some(VttErrorCode::UnsupportedFeature)
    );
    assert_eq!(document.source_bytes(), source);
    Ok(())
}

#[test]
fn policy_rejects_invalid_limits_and_oversized_input() -> Result<(), Box<dyn std::error::Error>> {
    assert_eq!(
        VttParsePolicy::new(0, 1, 1).err(),
        Some(VttPolicyError::ZeroLimit)
    );
    assert_eq!(
        VttParsePolicy::new(2, 1, 3).err(),
        Some(VttPolicyError::LineLimitExceedsFileLimit)
    );
    let policy = VttParsePolicy::new(4, 1, 4)?;
    assert_eq!(
        VttDocument::parse_with_policy(b"WEBVTT", policy)
            .err()
            .map(|error| error.code),
        Some(VttErrorCode::FileTooLarge)
    );
    Ok(())
}
