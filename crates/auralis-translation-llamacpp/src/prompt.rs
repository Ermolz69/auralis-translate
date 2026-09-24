pub(crate) fn translate_line(source: &str) -> String {
    format!(
        "Translate the following text into Russian. Note that you should only output the translated result without any additional explanation:\n{source}"
    )
}
