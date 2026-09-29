mod support;

use auralis_translation::{
    InferenceRequestFinish, InferenceRequestId, InferenceRequestKind, InferenceRequestOutcome,
    InferenceRequestStart, SegmentId, SourceHash,
};
use auralis_translation_sqlite::{DbError, RunStop, SegmentSpec, SqliteConfig, TranslateDb};
use std::error::Error;
use support::{run_spec, test_directory, translation_spec};

fn source_segment() -> Result<SegmentSpec, Box<dyn Error>> {
    Ok(SegmentSpec {
        id: SegmentId::new(1).ok_or("invalid segment ID")?,
        ordinal: 0,
        cue_label: Some("1".into()),
        start_ms: 1000,
        end_ms: 2000,
        source_lines: vec!["source".into()],
        text_ranges: std::iter::once(2..8).collect(),
        parser_version: 1,
    })
}

fn start(id: &str) -> Result<InferenceRequestStart, Box<dyn Error>> {
    Ok(InferenceRequestStart {
        request_id: InferenceRequestId::parse(id)?,
        kind: InferenceRequestKind::ChatCompletion,
        run_id: run_spec()?.run_id,
        batch_fingerprint: SourceHash::digest(b"batch"),
        segment_id: SegmentId::new(1).ok_or("invalid segment ID")?,
        line_index: 0,
        rendered_request: br#"{"messages":[{"content":"source"}]}"#.to_vec(),
    })
}

#[test]
fn rejected_raw_candidate_survives_reopen_and_later_success() -> Result<(), Box<dyn Error>> {
    let directory = test_directory()?;
    let path = directory.join("journal.sqlite");
    let translation = translation_spec()?;
    let run = run_spec()?;
    let mut db = TranslateDb::open(&path, SqliteConfig::default())?;
    db.ensure_translation(&translation)?;
    db.ensure_segments(translation.translation_id, 20, &[source_segment()?])?;
    let attempt = db.begin_attempt(&run, None)?;
    let rejected = start("33333333-3333-4333-8333-333333333333")?;
    db.begin_inference_request(attempt, &rejected)?;
    drop(db);

    let mut db = TranslateDb::open(&path, SqliteConfig::default())?;
    let pending = db.inference_requests(run.run_id)?;
    assert_eq!(pending.len(), 1);
    assert_eq!(pending[0].start, rejected);
    assert_eq!(pending[0].finish, None);
    let failure = InferenceRequestFinish {
        request_id: rejected.request_id,
        outcome: InferenceRequestOutcome::MalformedCandidate,
        raw_response: Some(br#"{"choices":[{"message":{"content":"bad json"}}]}"#.to_vec()),
        restored_candidate: None,
        prompt_tokens: Some(37),
        completion_tokens: Some(4),
        elapsed_ms: 123,
        error_detail: Some("invalid line JSON".into()),
    };
    db.finish_inference_request(&failure)?;
    db.finish_inference_request(&failure)?;
    let accepted = start("44444444-4444-4444-8444-444444444444")?;
    db.begin_inference_request(attempt, &accepted)?;
    let success = InferenceRequestFinish {
        request_id: accepted.request_id,
        outcome: InferenceRequestOutcome::ValidatedLine,
        raw_response: Some(
            r#"{"choices":[{"message":{"content":"перевод"}}]}"#
                .as_bytes()
                .to_vec(),
        ),
        restored_candidate: Some("перевод".into()),
        prompt_tokens: Some(37),
        completion_tokens: Some(8),
        elapsed_ms: 456,
        error_detail: None,
    };
    db.finish_inference_request(&success)?;
    drop(db);

    let db = TranslateDb::open(&path, SqliteConfig::default())?;
    let requests = db.inference_requests(run.run_id)?;
    assert_eq!(requests.len(), 2);
    assert!(requests[0].sequence < requests[1].sequence);
    assert_eq!(requests[0].finish, Some(failure));
    assert_eq!(requests[1].finish, Some(success));
    assert_eq!(
        db.translation(translation.translation_id)?.source_hash,
        translation.source_hash
    );
    drop(db);
    std::fs::remove_dir_all(directory)?;
    Ok(())
}

#[test]
fn request_identity_and_source_position_cannot_be_reassigned() -> Result<(), Box<dyn Error>> {
    let directory = test_directory()?;
    let path = directory.join("identity.sqlite");
    let translation = translation_spec()?;
    let run = run_spec()?;
    let mut db = TranslateDb::open(&path, SqliteConfig::default())?;
    db.ensure_translation(&translation)?;
    db.ensure_segments(translation.translation_id, 20, &[source_segment()?])?;
    let attempt = db.begin_attempt(&run, None)?;
    let request = start("55555555-5555-4555-8555-555555555555")?;
    db.begin_inference_request(attempt, &request)?;
    db.begin_inference_request(attempt, &request)?;
    let mut changed = request.clone();
    changed.rendered_request.push(b' ');
    assert!(matches!(
        db.begin_inference_request(attempt, &changed),
        Err(DbError::Conflict(_))
    ));
    let mut wrong_line = request.clone();
    wrong_line.request_id = InferenceRequestId::parse("66666666-6666-4666-8666-666666666666")?;
    wrong_line.line_index = 1;
    assert!(matches!(
        db.begin_inference_request(attempt, &wrong_line),
        Err(DbError::InvalidSpec(_))
    ));
    let mut wrong_run = request.clone();
    wrong_run.request_id = InferenceRequestId::parse("77777777-7777-4777-8777-777777777777")?;
    wrong_run.run_id = auralis_translation::RunId::parse("88888888-8888-4888-8888-888888888888")?;
    assert!(matches!(
        db.begin_inference_request(attempt, &wrong_run),
        Err(DbError::Conflict(_))
    ));
    db.stop_attempt(run.run_id, attempt, RunStop::Failed, "test stop")?;
    let another = start("99999999-9999-4999-8999-999999999999")?;
    assert!(matches!(
        db.begin_inference_request(attempt, &another),
        Err(DbError::Conflict(_))
    ));
    drop(db);
    std::fs::remove_dir_all(directory)?;
    Ok(())
}

#[test]
fn parsed_preflight_rows_survive_reopen_without_becoming_accepted_lines()
-> Result<(), Box<dyn Error>> {
    let directory = test_directory()?;
    let path = directory.join("preflight.sqlite");
    let translation = translation_spec()?;
    let run = run_spec()?;
    let mut db = TranslateDb::open(&path, SqliteConfig::default())?;
    db.ensure_translation(&translation)?;
    db.ensure_segments(translation.translation_id, 20, &[source_segment()?])?;
    let attempt = db.begin_attempt(&run, None)?;
    let mut template = start("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa")?;
    template.kind = InferenceRequestKind::ApplyTemplate;
    template.rendered_request = br#"{"messages":[{"role":"user","content":"source"}]}"#.to_vec();
    db.begin_inference_request(attempt, &template)?;
    let parsed = InferenceRequestFinish {
        request_id: template.request_id,
        outcome: InferenceRequestOutcome::ParsedPreflightJson,
        raw_response: Some(br#"{"prompt":"rendered"}"#.to_vec()),
        restored_candidate: None,
        prompt_tokens: None,
        completion_tokens: None,
        elapsed_ms: 5,
        error_detail: None,
    };
    db.finish_inference_request(&parsed)?;
    let mut wrong = parsed.clone();
    wrong.outcome = InferenceRequestOutcome::ValidatedLine;
    wrong.restored_candidate = Some("rendered".into());
    assert!(matches!(
        db.finish_inference_request(&wrong),
        Err(DbError::InvalidSpec(_))
    ));
    drop(db);
    let db = TranslateDb::open(&path, SqliteConfig::default())?;
    let saved = db.inference_requests(run.run_id)?;
    assert_eq!(saved.len(), 1);
    assert_eq!(saved[0].start, template);
    assert_eq!(saved[0].finish, Some(parsed));
    assert!(db.checkpoints(run.run_id)?.is_empty());
    drop(db);
    std::fs::remove_dir_all(directory)?;
    Ok(())
}
