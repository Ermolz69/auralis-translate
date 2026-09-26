use crate::glossary_input;
use crate::read_source::read_bounded;
use crate::write_new::write_new;
use auralis_translation::{Glossary, SourceHash};
use auralis_translation_formats::srt::SrtParsePolicy;
use std::error::Error;
use std::path::Path;

const GLOSSARY_DIRECTORY: &str = "glossaries";

pub(crate) fn store(
    state_dir: &Path,
    hash: SourceHash,
    bytes: &[u8],
) -> Result<(), Box<dyn Error>> {
    let directory = state_dir.join(GLOSSARY_DIRECTORY);
    std::fs::create_dir_all(&directory)?;
    let path = directory.join(format!("{hash}.json"));
    if path.exists() {
        let saved = read_bounded(&path, SrtParsePolicy::default().max_bytes(), "glossary")?;
        if saved != bytes {
            return Err(crate::reporting::CliFailure::boxed(
                crate::reporting::ErrorCode::Conflict,
                "managed glossary differs from frozen revision",
            ));
        }
    } else {
        write_new(&path, bytes)?;
    }
    Ok(())
}

pub(crate) fn load(
    state_dir: &Path,
    revision: Option<&str>,
) -> Result<Option<Glossary>, Box<dyn Error>> {
    let Some(revision) = revision else {
        return Ok(None);
    };
    let hash = SourceHash::parse_hex(revision).ok_or("invalid glossary revision")?;
    let path = state_dir
        .join(GLOSSARY_DIRECTORY)
        .join(format!("{hash}.json"));
    let bytes = read_bounded(&path, SrtParsePolicy::default().max_bytes(), "glossary")?;
    if SourceHash::digest(&bytes) != hash {
        return Err(crate::reporting::CliFailure::boxed(
            crate::reporting::ErrorCode::Conflict,
            "managed glossary hash differs from frozen run",
        ));
    }
    Ok(Some(glossary_input::parse(&bytes)?))
}
