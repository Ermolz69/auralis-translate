use auralis_translation_formats::srt::{SegmentTranslation, SrtDocument};

const LF_SOURCE: &[u8] = include_bytes!("fixtures/plain.srt");

#[test]
fn extracts_exact_slots_and_keeps_duplicate_cue_labels_distinct()
-> Result<(), Box<dyn std::error::Error>> {
    let document = SrtDocument::parse(LF_SOURCE)?;
    let segments = document.segments();

    assert_eq!(segments.len(), 2);
    assert_eq!(segments[0].id.get(), 1);
    assert_eq!(segments[1].id.get(), 2);
    assert_eq!(segments[0].cue_label, "1");
    assert_eq!(segments[1].cue_label, "1");
    assert_eq!((segments[0].start_ms, segments[0].end_ms), (1000, 2500));
    assert_eq!(segments[0].text_slots[0].text, "你好。");
    assert_eq!(segments[1].text_slots[0].text, "明天见。");
    assert_eq!(segments[1].text_slots[1].text, "再见。");
    for slot in segments.iter().flat_map(|segment| &segment.text_slots) {
        assert_eq!(&LF_SOURCE[slot.byte_range.clone()], slot.text.as_bytes());
    }
    assert_eq!(
        document.render(&document.original_translations())?,
        LF_SOURCE
    );
    Ok(())
}

#[test]
fn roundtrips_crlf_bom_and_terminal_line_policy() -> Result<(), Box<dyn std::error::Error>> {
    let source = b"\xef\xbb\xbf7\r\n00:00:00,010 --> 00:00:00,020\r\nA\r\nB";
    let document = SrtDocument::parse(source)?;
    assert_eq!(document.render(&document.original_translations())?, source);
    Ok(())
}

#[test]
fn renders_a_separate_copy_with_only_text_slots_changed() -> Result<(), Box<dyn std::error::Error>>
{
    let document = SrtDocument::parse(LF_SOURCE)?;
    let source_before = document.source_bytes().to_vec();
    let replacements = vec![
        SegmentTranslation {
            id: document.segments()[0].id,
            lines: vec!["Привет.".into()],
        },
        SegmentTranslation {
            id: document.segments()[1].id,
            lines: vec!["Увидимся завтра.".into(), "Пока.".into()],
        },
    ];

    let output = document.render(&replacements)?;
    let reparsed = SrtDocument::parse(&output)?;

    assert_eq!(document.source_bytes(), source_before);
    assert_ne!(output, LF_SOURCE);
    assert_eq!(reparsed.segments().len(), document.segments().len());
    assert_eq!(reparsed.segments()[0].text_slots[0].text, "Привет.");
    assert_eq!(reparsed.segments()[1].text_slots[1].text, "Пока.");
    assert!(output.ends_with(b"\n\n"));
    Ok(())
}

#[test]
fn roundtrips_generated_line_and_bom_variants() -> Result<(), Box<dyn std::error::Error>> {
    for ending in ["\n", "\r\n"] {
        for bom in ["", "\u{feff}"] {
            for terminal in ["", "\n", "\n\n"] {
                let terminal = terminal.replace('\n', ending);
                let source = format!(
                    "{bom}7{ending}00:00:00,010 --> 00:00:00,020{ending}汉字{ending}日本語{terminal}"
                );
                let document = SrtDocument::parse(source.as_bytes())?;
                assert_eq!(
                    document.render(&document.original_translations())?,
                    source.as_bytes()
                );
            }
        }
    }
    Ok(())
}
