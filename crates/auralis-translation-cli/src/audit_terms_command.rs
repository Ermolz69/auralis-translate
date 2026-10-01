use crate::{
    read_source::read_source,
    reporting::{CliFailure, CommandOutput, ErrorCode},
    scene_map_input, terms_input,
};
use auralis_translation::{SceneMap, SourceHash, TargetSegment, audit_approved_terms};
use auralis_translation_formats::srt::SrtDocument;
use serde::Serialize;
use std::{error::Error, ffi::OsStr, path::Path};

const REPORT_SCHEMA_VERSION: u32 = 1;

#[derive(Serialize)]
struct MissingForm {
    segment_id: u32,
    line_index: u32,
    code: &'static str,
}

#[derive(Serialize)]
struct AuditReport {
    schema_version: u32,
    source_sha256: String,
    result_sha256: String,
    scene_map_sha256: String,
    terms_ledger_sha256: String,
    segments: usize,
    target_lines: usize,
    checked_term_lines: usize,
    warnings: Vec<MissingForm>,
    human_review: &'static str,
    assessment: &'static str,
}

pub(crate) fn run(
    source_path: &OsStr,
    result_path: &OsStr,
    scene_path: &OsStr,
    terms_path: &OsStr,
    reporter: &mut CommandOutput,
) -> Result<(), Box<dyn Error>> {
    let source = read_source(Path::new(source_path))?;
    let result = read_source(Path::new(result_path))?;
    let original = SrtDocument::parse(&source)?;
    let rendered = SrtDocument::parse(&result)?;
    let translated = rendered.original_translations();
    if original.render(&translated)? != result {
        return Err(CliFailure::boxed(
            ErrorCode::InvalidSource,
            "result differs from source outside declared text slots",
        ));
    }
    let source_segments = original.source_segments()?;
    let scene = scene_map_input::read(Path::new(scene_path), &source)?;
    SceneMap::new(&source_segments, &scene.end_ids)?;
    let ledger = terms_input::read(Path::new(terms_path), &source, scene.snapshot_hash)?;
    ledger.terms.validate_against(&source_segments)?;
    let accepted = translated
        .into_iter()
        .map(|segment| TargetSegment {
            id: segment.id,
            lines: segment.lines,
        })
        .collect::<Vec<_>>();
    let warnings = audit_approved_terms(&source_segments, &accepted, &ledger.terms)?
        .into_iter()
        .map(|warning| MissingForm {
            segment_id: warning.segment_id.get(),
            line_index: warning.line_index,
            code: warning.code.as_str(),
        })
        .collect();
    let checked_term_lines = source_segments
        .iter()
        .flat_map(|segment| {
            ledger.terms.entries().iter().flat_map(move |term| {
                segment.lines().iter().filter(move |line| {
                    term.segment_ids().contains(&segment.id()) && line.contains(term.source())
                })
            })
        })
        .count();
    let report = AuditReport {
        schema_version: REPORT_SCHEMA_VERSION,
        source_sha256: SourceHash::digest(&source).to_string(),
        result_sha256: SourceHash::digest(&result).to_string(),
        scene_map_sha256: scene.snapshot_hash.to_string(),
        terms_ledger_sha256: ledger.snapshot_hash.to_string(),
        segments: source_segments.len(),
        target_lines: accepted.iter().map(|segment| segment.lines.len()).sum(),
        checked_term_lines,
        warnings,
        human_review: "not_performed",
        assessment: "form_screen_only",
    };
    reporter.report("audit-terms", &report)
}
