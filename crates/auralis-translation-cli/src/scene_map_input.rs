use crate::read_source::read_bounded;
use crate::reporting::{CliFailure, ErrorCode};
use crate::write_new::write_new;
use auralis_translation::{RunId, SegmentId, SourceHash};
use auralis_translation_formats::srt::SrtParsePolicy;
use serde::Deserialize;
use std::error::Error;
use std::path::Path;

const SCHEMA_VERSION: u32 = 1;
const DIRECTORY: &str = "scene-maps";

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Payload {
    schema_version: u32,
    source_sha256: String,
    evidence_id: String,
    scene_end_ids: Vec<u32>,
}

pub(crate) struct SceneMapInput {
    pub end_ids: Vec<SegmentId>,
    pub snapshot_hash: SourceHash,
    bytes: Vec<u8>,
}

pub(crate) fn read(path: &Path, source: &[u8]) -> Result<SceneMapInput, Box<dyn Error>> {
    let bytes = read_bounded(path, SrtParsePolicy::default().max_bytes(), "scene map")?;
    parse(bytes, source)
}

fn parse(bytes: Vec<u8>, source: &[u8]) -> Result<SceneMapInput, Box<dyn Error>> {
    let payload: Payload = serde_json::from_slice(&bytes)?;
    if payload.schema_version != SCHEMA_VERSION {
        return Err(CliFailure::boxed(
            ErrorCode::InvalidInput,
            "unsupported scene map schema version",
        ));
    }
    if SourceHash::parse_hex(&payload.source_sha256) != Some(SourceHash::digest(source)) {
        return Err(CliFailure::boxed(
            ErrorCode::Conflict,
            "scene map source hash differs from the original",
        ));
    }
    if payload.evidence_id.trim().is_empty() || payload.evidence_id.len() > 256 {
        return Err(CliFailure::boxed(
            ErrorCode::InvalidInput,
            "scene map requires a bounded evidence ID",
        ));
    }
    let end_ids = payload
        .scene_end_ids
        .into_iter()
        .map(|id| SegmentId::new(id).ok_or("scene map contains a zero segment ID"))
        .collect::<Result<Vec<_>, _>>()?;
    Ok(SceneMapInput {
        end_ids,
        snapshot_hash: SourceHash::digest(&bytes),
        bytes,
    })
}

pub(crate) fn store(
    state_dir: &Path,
    run_id: RunId,
    scene: &SceneMapInput,
) -> Result<(), Box<dyn Error>> {
    let directory = state_dir.join(DIRECTORY);
    std::fs::create_dir_all(&directory)?;
    write_new(&directory.join(format!("{run_id}.json")), &scene.bytes)?;
    Ok(())
}

pub(crate) fn load(
    state_dir: &Path,
    run_id: RunId,
    source: &[u8],
) -> Result<Option<SceneMapInput>, Box<dyn Error>> {
    let path = state_dir.join(DIRECTORY).join(format!("{run_id}.json"));
    if !path.exists() {
        return Ok(None);
    }
    let root = std::fs::canonicalize(state_dir.join(DIRECTORY))?;
    let canonical = std::fs::canonicalize(&path)?;
    if !canonical.starts_with(root) {
        return Err(CliFailure::boxed(
            ErrorCode::Conflict,
            "managed scene map lies outside the state directory",
        ));
    }
    let bytes = read_bounded(
        &canonical,
        SrtParsePolicy::default().max_bytes(),
        "scene map",
    )?;
    Ok(Some(parse(bytes, source)?))
}
