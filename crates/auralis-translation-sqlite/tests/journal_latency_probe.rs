mod support;

use auralis_translation::{
    InferenceRequestFinish, InferenceRequestId, InferenceRequestJournal, InferenceRequestKind,
    InferenceRequestOutcome, InferenceRequestStart, SegmentId, SourceHash,
};
use auralis_translation_sqlite::{
    SegmentSpec, SqliteConfig, SqliteInferenceRequestSink, TranslateDb,
};
use std::error::Error;
use std::time::Instant;
use support::{run_spec, test_directory, translation_spec};

const REPEATS: usize = 3;
const REQUESTS_PER_KIND: usize = 27;

#[test]
#[ignore = "bounded PERF-03 storage workload; run through Taskfile"]
fn repeated_journal_finishes() -> Result<(), Box<dyn Error>> {
    for repetition in 0..REPEATS {
        let directory = test_directory()?;
        let path = directory.join("journal.sqlite");
        let translation = translation_spec()?;
        let run = run_spec()?;
        let mut db = TranslateDb::open(&path, SqliteConfig::default())?;
        db.ensure_translation(&translation)?;
        db.ensure_segments(
            translation.translation_id,
            20,
            &[SegmentSpec {
                id: SegmentId::new(1).ok_or("segment ID")?,
                ordinal: 0,
                cue_label: Some("1".into()),
                start_ms: 1000,
                end_ms: 2000,
                source_lines: vec!["fixture".into()],
                text_ranges: std::iter::once(0..7).collect(),
                parser_version: 1,
            }],
        )?;
        let attempt = db.begin_attempt(&run, None)?;
        let sink = SqliteInferenceRequestSink::open(&path, SqliteConfig::default(), attempt)?;
        let mut durations = Vec::new();
        for index in 0..REQUESTS_PER_KIND * 2 {
            let kind = if index % 2 == 0 {
                InferenceRequestKind::CountInputTokens
            } else {
                InferenceRequestKind::ChatCompletion
            };
            let request_id =
                InferenceRequestId::parse(&format!("00000000-0000-4000-8000-{index:012x}"))?;
            let body = format!(
                "{{\"fixture\":{index},\"padding\":\"{}\"}}",
                "x".repeat(2048)
            );
            let start = InferenceRequestStart {
                request_id,
                kind,
                run_id: run.run_id,
                batch_fingerprint: SourceHash::digest(b"PERF-03 fixture batch"),
                segment_id: SegmentId::new(1).ok_or("segment ID")?,
                line_index: 0,
                rendered_request: body.into_bytes(),
            };
            sink.begin(&start)
                .map_err(|error| std::io::Error::other(error.to_string()))?;
            let finish = InferenceRequestFinish {
                request_id,
                outcome: if kind == InferenceRequestKind::ChatCompletion {
                    InferenceRequestOutcome::ValidatedBatch
                } else {
                    InferenceRequestOutcome::ParsedPreflightJson
                },
                raw_response: Some(vec![b'r'; 4096]),
                restored_candidate: if kind == InferenceRequestKind::ChatCompletion {
                    Some("fixture accepted slots".into())
                } else {
                    None
                },
                prompt_tokens: None,
                completion_tokens: None,
                elapsed_ms: 1,
                error_detail: None,
            };
            let began = Instant::now();
            sink.finish(&finish)
                .map_err(|error| std::io::Error::other(error.to_string()))?;
            durations.push(u64::try_from(began.elapsed().as_micros())?);
        }
        drop(sink);
        drop(db);
        let db = TranslateDb::open(&path, SqliteConfig::default())?;
        assert_eq!(
            db.inference_requests(run.run_id)?.len(),
            REQUESTS_PER_KIND * 2
        );
        assert!(db.checkpoints(run.run_id)?.is_empty());
        assert_eq!(
            db.translation(translation.translation_id)?.source_hash,
            translation.source_hash
        );
        durations.sort_unstable();
        let sum: u64 = durations.iter().sum();
        println!(
            "PERF03_FIXTURE {{\"repetition\":{},\"count\":{},\"sum_us\":{},\"p50_us\":{},\"p95_us\":{},\"max_us\":{}}}",
            repetition + 1,
            durations.len(),
            sum,
            durations[durations.len().div_ceil(2) - 1],
            durations[(95 * durations.len()).div_ceil(100) - 1],
            durations.last().ok_or("missing duration")?
        );
        drop(db);
        std::fs::remove_dir_all(directory)?;
    }
    Ok(())
}
