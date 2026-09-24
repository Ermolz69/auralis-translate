use crate::read_source::read_bounded;
use auralis_translation::{Glossary, GlossaryEntry, SegmentId, SourceHash};
use auralis_translation_formats::srt::SrtParsePolicy;
use serde::Deserialize;
use std::error::Error;
use std::path::Path;

const GLOSSARY_SCHEMA_VERSION: u32 = 1;

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct EntryPayload {
    source: String,
    target: String,
    #[serde(default)]
    allowed_forms: Vec<String>,
    segment_ids: Option<Vec<u32>>,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct GlossaryPayload {
    schema_version: u32,
    entries: Vec<EntryPayload>,
}

pub(crate) fn read(path: &Path) -> Result<(Glossary, SourceHash, Vec<u8>), Box<dyn Error>> {
    let bytes = read_bounded(path, SrtParsePolicy::default().max_bytes(), "glossary")?;
    let glossary = parse(&bytes)?;
    let hash = SourceHash::digest(&bytes);
    Ok((glossary, hash, bytes))
}

pub(crate) fn parse(bytes: &[u8]) -> Result<Glossary, Box<dyn Error>> {
    let payload: GlossaryPayload = serde_json::from_slice(bytes)?;
    if payload.schema_version != GLOSSARY_SCHEMA_VERSION {
        return Err("unsupported glossary schema version".into());
    }
    let entries = payload
        .entries
        .into_iter()
        .map(|entry| {
            let ids = entry
                .segment_ids
                .map(|ids| {
                    ids.into_iter()
                        .map(|id| SegmentId::new(id).ok_or("zero glossary segment ID"))
                        .collect::<Result<Vec<_>, _>>()
                })
                .transpose()?;
            Ok(GlossaryEntry::new(
                entry.source,
                entry.target,
                entry.allowed_forms,
                ids,
            )?)
        })
        .collect::<Result<Vec<_>, Box<dyn Error>>>()?;
    Ok(Glossary::new(entries)?)
}
