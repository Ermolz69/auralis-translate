use auralis_translation::{GlossaryEntry, SourceSegment};
use serde_json::json;

pub(crate) fn translate_line(source: &str) -> String {
    format!(
        "Translate the following text into Russian. Note that you should only output the translated result without any additional explanation:\n{source}"
    )
}

pub(crate) fn translate_line_with_context(
    target: &SourceSegment,
    line_index: usize,
    context: &[SourceSegment],
) -> String {
    let context = context
        .iter()
        .map(|segment| {
            json!({
                "start_ms": segment.start_ms(),
                "end_ms": segment.end_ms(),
                "lines": segment.lines(),
            })
        })
        .collect::<Vec<_>>();
    let input = json!({
        "context_subtitles": context,
        "target_subtitle": {
            "start_ms": target.start_ms(),
            "end_ms": target.end_ms(),
            "lines": target.lines(),
        },
        "target_line_index": line_index,
    });
    format!(
        "Translate only target_subtitle.lines[target_line_index] into Russian. Use context_subtitles and other target lines only to understand meaning. Do not translate or repeat context. Output exactly one Russian subtitle line, with no explanation or labels. Input JSON:\n{input}"
    )
}

pub(crate) fn translate_line_with_glossary(
    target: &SourceSegment,
    line_index: usize,
    context: &[SourceSegment],
    glossary: &[GlossaryEntry],
) -> String {
    let context = context
        .iter()
        .map(|segment| {
            json!({
                "start_ms": segment.start_ms(),
                "end_ms": segment.end_ms(),
                "lines": segment.lines(),
            })
        })
        .collect::<Vec<_>>();
    let terms = confirmed_terms(glossary);
    let input = json!({
        "context_subtitles": context,
        "target_subtitle": {
            "start_ms": target.start_ms(),
            "end_ms": target.end_ms(),
            "lines": target.lines(),
        },
        "target_line_index": line_index,
        "confirmed_glossary": terms,
    });
    format!(
        "Translate only target_subtitle.lines[target_line_index] into Russian. Use context_subtitles and other target lines only for meaning. Follow confirmed_glossary for applicable terms, choosing a grammatical Russian form; do not mechanically replace unrelated text. Preserve names, facts, numbers and negation. Return exactly one Russian subtitle line with no labels or explanation. Input JSON:\n{input}"
    )
}

pub(crate) fn glossary_payload_bytes(
    glossary: &[GlossaryEntry],
) -> Result<usize, serde_json::Error> {
    if glossary.is_empty() {
        return Ok(0);
    }
    Ok(serde_json::to_vec(&confirmed_terms(glossary))?.len())
}

fn confirmed_terms(glossary: &[GlossaryEntry]) -> Vec<serde_json::Value> {
    glossary
        .iter()
        .map(|entry| {
            json!({
                "source": entry.source(),
                "target": entry.target(),
                "allowed_forms": entry.allowed_forms(),
            })
        })
        .collect()
}
