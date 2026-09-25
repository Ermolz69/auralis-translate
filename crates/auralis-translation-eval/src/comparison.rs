use std::{collections::BTreeSet, fs, time::Instant};

use auralis_translation::{
    LanguageCode, LanguagePair, RunId, SegmentId, SourceHash, SourceSegment, TranslationBatch,
    TranslationId, TranslationProvider, translate_batch,
};
use uuid::Uuid;

use crate::{
    comparison_error::ComparisonError,
    comparison_report::ComparisonReport,
    comparison_request::ComparisonRequest,
    comparison_row::ComparisonRow,
    manifest::Manifest,
    verify::{VerifyError, verify_flores},
};

const REPORT_SCHEMA_VERSION: u32 = 1;
const MAX_SAMPLE_ROWS: usize = 32;
const REFERENCE_LANGUAGE: &str = "rus_Cyrl";

pub fn compare_flores(
    request: &ComparisonRequest,
    provider: &impl TranslationProvider,
) -> Result<ComparisonReport, ComparisonError> {
    let corpus = verify_flores(
        &request.manifest_path,
        &request.archive_path,
        &request.corpus_root,
    )?;
    let Some(&row_count) = corpus.splits.get(&request.split) else {
        return Err(ComparisonError::InvalidInput("unknown split".into()));
    };
    let source_language = match request.language.as_str() {
        "zho_Hans" | "zho_Hant" => LanguageCode::Chinese,
        "jpn_Jpan" => LanguageCode::Japanese,
        _ => {
            return Err(ComparisonError::InvalidInput(
                "unsupported source language".into(),
            ));
        }
    };
    if request.row_ids.is_empty()
        || request.row_ids.len() > MAX_SAMPLE_ROWS
        || request.row_ids.iter().any(|&id| id == 0 || id > row_count)
        || request.row_ids.iter().collect::<BTreeSet<_>>().len() != request.row_ids.len()
    {
        return Err(ComparisonError::InvalidInput(
            "row IDs must be unique, one-based, and inside the split".into(),
        ));
    }
    let manifest: Manifest =
        serde_json::from_slice(&fs::read(&request.manifest_path)?).map_err(VerifyError::from)?;
    let selected = manifest
        .splits
        .iter()
        .find(|split| split.name == request.split)
        .ok_or_else(|| ComparisonError::InvalidInput("verified split disappeared".into()))?;
    let source_entry = selected
        .files
        .get(&request.language)
        .ok_or_else(|| ComparisonError::InvalidInput("verified source disappeared".into()))?;
    let reference_entry = selected
        .files
        .get(REFERENCE_LANGUAGE)
        .ok_or_else(|| ComparisonError::InvalidInput("verified reference disappeared".into()))?;
    let sources = read_checked_lines(
        &request.corpus_root.join(format!(
            "{}/{}.{}",
            request.split, request.language, request.split
        )),
        &source_entry.sha256,
    )?;
    let references = read_checked_lines(
        &request.corpus_root.join(format!(
            "{}/{}.{}",
            request.split, REFERENCE_LANGUAGE, request.split
        )),
        &reference_entry.sha256,
    )?;
    let pair = LanguagePair::new(source_language, LanguageCode::Russian)?;
    let translation_id = TranslationId::new(Uuid::new_v4())
        .ok_or_else(|| ComparisonError::InvalidInput("new translation ID is nil".into()))?;
    let run_id = RunId::new(Uuid::new_v4())
        .ok_or_else(|| ComparisonError::InvalidInput("new run ID is nil".into()))?;
    let mut rows = Vec::with_capacity(request.row_ids.len());
    for &row_id in &request.row_ids {
        let source = sources[row_id - 1].clone();
        let reference_ru = references[row_id - 1].clone();
        let segment_id = SegmentId::new(1)
            .ok_or_else(|| ComparisonError::InvalidInput("segment ID is invalid".into()))?;
        // The reusable provider contract requires a time span; these inert values are not subtitle timings.
        let target = SourceSegment::new(segment_id, 0, 1, vec![source.clone()])?;
        let batch = TranslationBatch::new(
            translation_id,
            run_id,
            SourceHash::digest(source.as_bytes()),
            pair,
            vec![target],
            Vec::new(),
        )?;
        let started = Instant::now();
        let accepted = translate_batch(provider, &batch)?;
        let elapsed_ms = started.elapsed().as_millis();
        let candidate_ru = accepted
            .into_iter()
            .next()
            .and_then(|segment| segment.lines.into_iter().next())
            .ok_or_else(|| ComparisonError::InvalidInput("accepted batch has no text".into()))?;
        rows.push(ComparisonRow {
            row_id,
            source,
            reference_ru,
            candidate_ru,
            elapsed_ms,
        });
    }
    Ok(ComparisonReport {
        schema_version: REPORT_SCHEMA_VERSION,
        dataset: corpus.dataset,
        corpus_source_url: corpus.source_url,
        corpus_license_id: corpus.license_id,
        corpus_archive_sha256: corpus.archive_sha256,
        split: request.split.clone(),
        source_language: request.language.clone(),
        profile_sha256: request.profile_sha256.clone(),
        model_sha256: request.model_sha256.clone(),
        runtime_build: request.runtime_build.clone(),
        rows,
        use_scope: "auxiliary_sentence_comparison_only",
        subtitle_holdout: false,
        bilingual_reviewed: false,
    })
}

fn read_checked_lines(
    path: &std::path::Path,
    expected_hash: &str,
) -> Result<Vec<String>, ComparisonError> {
    let bytes = fs::read(path)?;
    let actual_hash = SourceHash::digest(&bytes).to_string();
    if !actual_hash.eq_ignore_ascii_case(expected_hash) {
        return Err(ComparisonError::Corpus(VerifyError::HashMismatch {
            path: path.display().to_string(),
            expected: expected_hash.into(),
            actual: actual_hash,
        }));
    }
    let content = String::from_utf8(bytes)
        .map_err(|_| ComparisonError::InvalidInput("corpus file is not UTF-8".into()))?;
    Ok(content.lines().map(str::to_owned).collect())
}
