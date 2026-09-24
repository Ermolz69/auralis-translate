use auralis_translation_formats::srt::SrtParsePolicy;
use std::fs::File;
use std::io::{self, Read};
use std::path::Path;

pub(crate) fn read_source(path: &Path) -> io::Result<Vec<u8>> {
    let max_bytes = SrtParsePolicy::default().max_bytes();
    let file = File::open(path)?;
    if file.metadata()?.len() > max_bytes as u64 {
        return Err(io::Error::other(
            "source exceeds the configured SRT size limit",
        ));
    }
    let mut reader = file.take((max_bytes as u64).saturating_add(1));
    let mut bytes = Vec::new();
    reader.read_to_end(&mut bytes)?;
    if bytes.len() > max_bytes {
        return Err(io::Error::other(
            "source exceeds the configured SRT size limit",
        ));
    }
    Ok(bytes)
}
