use crate::read_source::read_bounded;
use crate::reporting::{CliFailure, ErrorCode};
use crate::write_new::write_new;
use auralis_translation::{ApprovedTerm, ApprovedTerms, RunId, SegmentId, SourceHash};
use auralis_translation_formats::srt::SrtParsePolicy;
use serde::Deserialize;
use std::error::Error;
use std::path::Path;

const SCHEMA_VERSION: u32 = 1;
const DIRECTORY: &str = "terms-ledgers";

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct TermPayload {
    source: String,
    target: String,
    #[serde(default)]
    allowed_forms: Vec<String>,
    segment_ids: Vec<u32>,
    reviewer_id: String,
    evidence_id: String,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Payload {
    schema_version: u32,
    source_sha256: String,
    scene_map_sha256: String,
    terms: Vec<TermPayload>,
}

pub(crate) struct TermsInput {
    pub terms: ApprovedTerms,
    pub snapshot_hash: SourceHash,
    bytes: Vec<u8>,
}

pub(crate) fn read(
    path: &Path,
    source: &[u8],
    scene_hash: SourceHash,
) -> Result<TermsInput, Box<dyn Error>> {
    let bytes = read_bounded(path, SrtParsePolicy::default().max_bytes(), "terms ledger")?;
    parse(bytes, source, scene_hash)
}

fn parse(
    bytes: Vec<u8>,
    source: &[u8],
    scene_hash: SourceHash,
) -> Result<TermsInput, Box<dyn Error>> {
    let payload: Payload = serde_json::from_slice(&bytes)?;
    if payload.schema_version != SCHEMA_VERSION {
        return Err(CliFailure::boxed(
            ErrorCode::InvalidInput,
            "unsupported terms ledger schema version",
        ));
    }
    if SourceHash::parse_hex(&payload.source_sha256) != Some(SourceHash::digest(source))
        || SourceHash::parse_hex(&payload.scene_map_sha256) != Some(scene_hash)
    {
        return Err(CliFailure::boxed(
            ErrorCode::Conflict,
            "terms ledger differs from source or scene map",
        ));
    }
    let terms = payload
        .terms
        .into_iter()
        .map(|entry| {
            let ids = entry
                .segment_ids
                .into_iter()
                .map(|id| {
                    SegmentId::new(id).ok_or_else(|| {
                        CliFailure::boxed(ErrorCode::InvalidInput, "zero terms segment ID")
                    })
                })
                .collect::<Result<Vec<_>, _>>()?;
            Ok(ApprovedTerm::new(
                entry.source,
                entry.target,
                entry.allowed_forms,
                ids,
                entry.reviewer_id,
                entry.evidence_id,
            )?)
        })
        .collect::<Result<Vec<_>, Box<dyn Error>>>()?;
    Ok(TermsInput {
        terms: ApprovedTerms::new(terms)?,
        snapshot_hash: SourceHash::digest(&bytes),
        bytes,
    })
}

pub(crate) fn store(
    state_dir: &Path,
    run_id: RunId,
    input: &TermsInput,
) -> Result<(), Box<dyn Error>> {
    let directory = state_dir.join(DIRECTORY);
    std::fs::create_dir_all(&directory)?;
    if !std::fs::canonicalize(&directory)?.starts_with(state_dir) {
        return Err(CliFailure::boxed(
            ErrorCode::Conflict,
            "managed terms directory lies outside state directory",
        ));
    }
    write_new(&directory.join(format!("{run_id}.json")), &input.bytes)?;
    Ok(())
}

pub(crate) fn load(
    state_dir: &Path,
    run_id: RunId,
    expected_hash: Option<&str>,
    source: &[u8],
    scene_hash: Option<SourceHash>,
) -> Result<Option<TermsInput>, Box<dyn Error>> {
    let path = state_dir.join(DIRECTORY).join(format!("{run_id}.json"));
    if !path.exists() {
        if expected_hash.is_some() {
            return Err(CliFailure::boxed(
                ErrorCode::Conflict,
                "frozen terms ledger is missing",
            ));
        }
        return Ok(None);
    }
    let scene_hash = scene_hash.ok_or_else(|| {
        CliFailure::boxed(
            ErrorCode::Conflict,
            "terms ledger requires frozen scene map",
        )
    })?;
    let root = std::fs::canonicalize(state_dir.join(DIRECTORY))?;
    let canonical = std::fs::canonicalize(&path)?;
    if !canonical.starts_with(root) {
        return Err(CliFailure::boxed(
            ErrorCode::Conflict,
            "managed terms ledger lies outside state directory",
        ));
    }
    let bytes = read_bounded(
        &canonical,
        SrtParsePolicy::default().max_bytes(),
        "terms ledger",
    )?;
    let input = parse(bytes, source, scene_hash)?;
    if expected_hash != Some(input.snapshot_hash.to_string().as_str()) {
        return Err(CliFailure::boxed(
            ErrorCode::Conflict,
            "managed terms ledger differs from frozen run",
        ));
    }
    Ok(Some(input))
}
