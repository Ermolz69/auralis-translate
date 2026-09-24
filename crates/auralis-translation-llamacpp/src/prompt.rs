use auralis_translation::SourceSegment;
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
