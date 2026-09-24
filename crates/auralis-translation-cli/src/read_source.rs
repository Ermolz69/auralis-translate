use auralis_translation_formats::srt::SrtParsePolicy;
use auralis_translation_formats::vtt::VttParsePolicy;
use std::fs::File;
use std::io::{self, Read};
use std::path::Path;

pub(crate) fn read_source(path: &Path) -> io::Result<Vec<u8>> {
    let max_bytes = SrtParsePolicy::default().max_bytes();
    read_bounded(path, max_bytes, "source")
}

pub(crate) fn read_vtt_source(path: &Path) -> io::Result<Vec<u8>> {
    read_bounded(path, VttParsePolicy::default().max_bytes(), "source")
}

pub(crate) fn read_bounded(path: &Path, max_bytes: usize, kind: &str) -> io::Result<Vec<u8>> {
    let file = File::open(path)?;
    if file.metadata()?.len() > max_bytes as u64 {
        return Err(io::Error::other(format!(
            "{kind} exceeds the configured size limit"
        )));
    }
    let mut reader = file.take((max_bytes as u64).saturating_add(1));
    let mut bytes = Vec::new();
    reader.read_to_end(&mut bytes)?;
    if bytes.len() > max_bytes {
        return Err(io::Error::other(format!(
            "{kind} exceeds the configured size limit"
        )));
    }
    Ok(bytes)
}
