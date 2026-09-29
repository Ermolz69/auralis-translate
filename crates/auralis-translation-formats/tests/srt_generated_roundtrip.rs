use auralis_translation_formats::srt::{SegmentTranslation, SrtDocument, SrtErrorCode};

const CASES: u64 = 64;
const TEXT: &[&str] = &[
    "你好。",
    "明天见。",
    "不要打开这扇门。",
    "AUR-001: 08:10",
    "俄语和中文 42",
    "可以，还是不可以？",
];

fn next(state: &mut u64) -> u64 {
    *state = state
        .wrapping_mul(6_364_136_223_846_793_005)
        .wrapping_add(1_442_695_040_888_963_407);
    *state >> 32
}

fn clock(ms: u64) -> String {
    format!(
        "{:02}:{:02}:{:02},{:03}",
        ms / 3_600_000,
        (ms / 60_000) % 60,
        (ms / 1_000) % 60,
        ms % 1_000
    )
}

fn source(seed: u64) -> Vec<u8> {
    let mut state = seed + 1;
    let ending = if seed.is_multiple_of(2) { "\n" } else { "\r\n" };
    let cue_count = 1 + next(&mut state) % 32;
    let mut cues = Vec::new();
    for index in 0..cue_count {
        let label = if seed.is_multiple_of(5) {
            7
        } else {
            1 + index % 13
        };
        let start = index * 2_000 + next(&mut state) % 250;
        let end = start + 500 + next(&mut state) % 1_200;
        let line_count = 1 + next(&mut state) % 3;
        let lines = (0..line_count)
            .map(|_| TEXT[(next(&mut state) as usize) % TEXT.len()])
            .collect::<Vec<_>>();
        cues.push(format!(
            "{label}{ending}{} --> {}{ending}{}",
            clock(start),
            clock(end),
            lines.join(ending)
        ));
    }
    let mut output = if seed.is_multiple_of(4) {
        "\u{feff}".to_owned()
    } else {
        String::new()
    };
    output.push_str(&cues.join(&format!("{ending}{ending}")));
    output.push_str(&ending.repeat((seed % 3) as usize));
    output.into_bytes()
}

fn protected_chunks(document: &SrtDocument) -> Vec<Vec<u8>> {
    document
        .protected_byte_ranges()
        .iter()
        .map(|range| document.source_bytes()[range.clone()].to_vec())
        .collect()
}

#[test]
fn generated_srt_roundtrips_and_preserves_all_protected_runs()
-> Result<(), Box<dyn std::error::Error>> {
    let mut total_cues = 0;
    let mut shortest_file = usize::MAX;
    let mut longest_file = 0;
    for seed in 0..CASES {
        let original = source(seed);
        let document = SrtDocument::parse(&original)?;
        total_cues += document.segments().len();
        shortest_file = shortest_file.min(document.segments().len());
        longest_file = longest_file.max(document.segments().len());
        assert_eq!(
            document.render(&document.original_translations())?,
            original,
            "seed={seed}"
        );
        let translations = document
            .segments()
            .iter()
            .map(|segment| SegmentTranslation {
                id: segment.id,
                lines: segment
                    .text_slots
                    .iter()
                    .enumerate()
                    .map(|(line, _)| format!("Перевод {seed}-{}-{line}", segment.id.get()))
                    .collect(),
            })
            .collect::<Vec<_>>();
        let rendered = document.render(&translations)?;
        let reparsed = SrtDocument::parse(&rendered)?;
        assert_eq!(
            reparsed.segments().len(),
            document.segments().len(),
            "seed={seed}"
        );
        assert_eq!(
            protected_chunks(&document),
            protected_chunks(&reparsed),
            "seed={seed}"
        );
        for ((before, after), replacement) in document
            .segments()
            .iter()
            .zip(reparsed.segments())
            .zip(&translations)
        {
            assert_eq!(
                (after.id, &after.cue_label, after.start_ms, after.end_ms),
                (before.id, &before.cue_label, before.start_ms, before.end_ms),
                "seed={seed}"
            );
            assert_eq!(
                after
                    .text_slots
                    .iter()
                    .map(|slot| &slot.text)
                    .collect::<Vec<_>>(),
                replacement.lines.iter().collect::<Vec<_>>(),
                "seed={seed}"
            );
        }
        assert_eq!(document.source_bytes(), original, "seed={seed}");
    }
    assert_eq!((total_cues, shortest_file, longest_file), (1_037, 1, 32));
    Ok(())
}

#[test]
fn generated_unsupported_markup_is_rejected_before_translation()
-> Result<(), Box<dyn std::error::Error>> {
    for seed in 0..CASES {
        let mut malformed = source(seed);
        let document = SrtDocument::parse(&malformed)?;
        let first_slot = document.segments()[0].text_slots[0].byte_range.clone();
        malformed.splice(first_slot, b"<b>unsafe</b>".iter().copied());
        assert!(
            matches!(SrtDocument::parse(&malformed), Err(error) if error.code == SrtErrorCode::UnsupportedMarkup),
            "seed={seed}"
        );
    }
    Ok(())
}
