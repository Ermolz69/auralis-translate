use auralis_translation::{
    BlockCheckpoint, CheckpointStore, InferenceRequestFinish, InferenceRequestJournal,
    InferenceRequestOutcome, InferenceRequestStart, LanguageCode, LanguagePair, ProgressSink,
    ProviderError, RetryPolicy, RunControl, RunId, RunProgress, SegmentId, SourceHash,
    SourceSegment, TranslationBatch, TranslationId, TranslationProvider,
    translate_planned_run_with_policy,
};
use auralis_translation_llamacpp::{LlamaCppProvider, ModelProfile};
use serde_json::{Value, json};
use std::error::Error;
use std::io::{self, Read, Write};
use std::net::TcpListener;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

const PROFILE: &[u8] = include_bytes!(
    "../../../models/manifests/hy_mt2_7b_q4_k_m.context_v6_slot_retry_tail.experimental.json"
);
const LENGTH_PROFILE: &[u8] = include_bytes!(
    "../../../models/manifests/hy_mt2_7b_q4_k_m.context_v6_slot_retry_tail_length.experimental.json"
);

#[derive(Default)]
struct MemoryStore(Vec<BlockCheckpoint>);

impl CheckpointStore for MemoryStore {
    type Error = io::Error;

    fn load(&self, _: RunId) -> Result<Vec<BlockCheckpoint>, Self::Error> {
        Ok(self.0.clone())
    }

    fn commit(&mut self, checkpoint: &BlockCheckpoint) -> Result<(), Self::Error> {
        self.0.push(checkpoint.clone());
        Ok(())
    }
}

#[derive(Default)]
struct MemoryJournal(Mutex<Vec<InferenceRequestFinish>>);

impl InferenceRequestJournal for MemoryJournal {
    fn begin(&self, _: &InferenceRequestStart) -> Result<(), Box<dyn Error + Send + Sync>> {
        Ok(())
    }

    fn finish(&self, finish: &InferenceRequestFinish) -> Result<(), Box<dyn Error + Send + Sync>> {
        self.0
            .lock()
            .map_err(|_| "journal poisoned")?
            .push(finish.clone());
        Ok(())
    }
}

struct NoPause;

impl RunControl for NoPause {
    fn pause_requested(&self, _: RunId) -> Result<bool, Box<dyn Error>> {
        Ok(false)
    }
}

#[derive(Default)]
struct Progress(Vec<RunProgress>);

impl ProgressSink for Progress {
    fn report(&mut self, progress: RunProgress) {
        self.0.push(progress);
    }
}

fn serve_response(
    stream: &mut impl ReadWrite,
    candidate: &str,
    finish_reason: &str,
) -> Result<Value, String> {
    let mut bytes = Vec::new();
    let mut buffer = [0u8; 4096];
    let (header_end, length) = loop {
        let count = stream
            .read(&mut buffer)
            .map_err(|error| error.to_string())?;
        if count == 0 {
            return Err("request ended before body".into());
        }
        bytes.extend_from_slice(&buffer[..count]);
        if let Some(end) = bytes.windows(4).position(|window| window == b"\r\n\r\n") {
            let head = String::from_utf8_lossy(&bytes[..end]);
            let length = head
                .lines()
                .find_map(|line| {
                    line.to_ascii_lowercase()
                        .strip_prefix("content-length: ")
                        .and_then(|value| value.parse::<usize>().ok())
                })
                .ok_or("missing content length")?;
            break (end + 4, length);
        }
    };
    while bytes.len() < header_end + length {
        let count = stream
            .read(&mut buffer)
            .map_err(|error| error.to_string())?;
        if count == 0 {
            return Err("request body truncated".into());
        }
        bytes.extend_from_slice(&buffer[..count]);
    }
    let request: Value = serde_json::from_slice(&bytes[header_end..header_end + length])
        .map_err(|error| error.to_string())?;
    let body = json!({"choices":[{"message":{"content":candidate},"finish_reason":finish_reason}]})
        .to_string();
    write!(
        stream,
        "HTTP/1.1 200 OK\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}",
        body.len()
    )
    .map_err(|error| error.to_string())?;
    Ok(request)
}

trait ReadWrite: Read + Write {}
impl<T: Read + Write> ReadWrite for T {}

fn candidate(text: &str) -> String {
    json!({"translations":[{"segment_id":72,"line_index":0,"text":text}]}).to_string()
}

fn runaway_candidate() -> String {
    "{\"translations\":[{\"line_index\":0,\"segment_id\":72,\"text\":\"В основном это блюдо невозможно найти снаружи」}]}]]}}}}}}}".into()
}

fn run_case(
    second: &str,
    succeeds: bool,
    first_length: bool,
    second_length: bool,
    first_length_candidate: Option<String>,
) -> Result<(), Box<dyn Error>> {
    let listener = TcpListener::bind("127.0.0.1:0")?;
    listener.set_nonblocking(true)?;
    let address = listener.local_addr()?;
    let first_answer = if first_length {
        first_length_candidate.unwrap_or_else(runaway_candidate)
    } else {
        candidate("В основном это блюдо невозможно найти снаружи」}]}")
    };
    let second_answer = if second_length {
        runaway_candidate()
    } else {
        candidate(second)
    };
    let server = std::thread::spawn(move || -> Result<Vec<Value>, String> {
        let mut requests = Vec::new();
        let deadline = Instant::now() + Duration::from_secs(5);
        for (answer, finish_reason) in [
            (&first_answer, if first_length { "length" } else { "stop" }),
            (
                &second_answer,
                if second_length { "length" } else { "stop" },
            ),
        ] {
            let mut stream = loop {
                match listener.accept() {
                    Ok((stream, _)) => break stream,
                    Err(error)
                        if error.kind() == io::ErrorKind::WouldBlock
                            && Instant::now() < deadline =>
                    {
                        std::thread::sleep(Duration::from_millis(10));
                    }
                    Err(error) => return Err(error.to_string()),
                }
            };
            stream
                .set_nonblocking(false)
                .map_err(|error| error.to_string())?;
            stream
                .set_read_timeout(Some(Duration::from_secs(5)))
                .map_err(|error| error.to_string())?;
            requests.push(serve_response(&mut stream, answer, finish_reason)?);
        }
        Ok(requests)
    });
    let mut profile: Value = serde_json::from_slice(if first_length {
        LENGTH_PROFILE
    } else {
        PROFILE
    })?;
    profile["context_before_segments"] = 0.into();
    profile["context_after_segments"] = 0.into();
    profile["max_context_bytes"] = 0.into();
    profile["token_safety_margin_tokens"] = Value::Null;
    let journal = Arc::new(MemoryJournal::default());
    let provider = LlamaCppProvider::new(
        &format!("http://{address}/"),
        ModelProfile::from_json(&serde_json::to_vec(&profile)?)?,
    )?
    .with_inference_journal(journal.clone());
    let batch = TranslationBatch::new(
        TranslationId::parse("11111111-1111-4111-8111-111111111111")?,
        RunId::parse("22222222-2222-4222-8222-222222222222")?,
        SourceHash::digest(b"json-tail-retry-fixture"),
        LanguagePair::new(LanguageCode::Chinese, LanguageCode::Russian)?,
        vec![SourceSegment::new(
            SegmentId::new(72).ok_or("invalid ID")?,
            1000,
            2000,
            vec!["这道菜在外面吃不到。".into()],
        )?],
        Vec::new(),
    )?;
    let mut store = MemoryStore::default();
    let mut progress = Progress::default();
    let result = translate_planned_run_with_policy(
        &provider,
        &mut store,
        &[vec![SegmentId::new(72).ok_or("invalid ID")?]],
        std::slice::from_ref(&batch),
        &mut progress,
        &NoPause,
        RetryPolicy::new(2).ok_or("invalid retry policy")?,
    );
    assert_eq!(result.is_ok(), succeeds, "{result:?}");
    let requests = server.join().map_err(|_| "server panicked")??;
    assert_eq!(requests.len(), 2);
    assert_eq!(
        requests[0], requests[1],
        "retry must use the same rendered request"
    );
    let attempts = journal.0.lock().map_err(|_| "journal poisoned")?;
    assert_eq!(attempts.len(), 2);
    assert_eq!(
        attempts[0].outcome,
        InferenceRequestOutcome::InvalidCandidate
    );
    assert!(attempts[0].raw_response.is_some());
    assert!(attempts[0].restored_candidate.is_none());
    assert_eq!(
        attempts[1].outcome,
        if succeeds {
            InferenceRequestOutcome::ValidatedLine
        } else {
            InferenceRequestOutcome::InvalidCandidate
        }
    );
    assert!(attempts[1].raw_response.is_some());
    assert_eq!(store.0.len(), usize::from(succeeds));
    if succeeds {
        assert_eq!(store.0[0].attempt_count, 2);
        assert_eq!(store.0[0].accepted[0].lines, [second]);
    }
    Ok(())
}

#[test]
fn json_tail_retries_once_then_commits_only_the_valid_second_answer() -> Result<(), Box<dyn Error>>
{
    run_case(
        "Это блюдо нельзя найти в других местах.",
        true,
        false,
        false,
        None,
    )
}

#[test]
fn second_json_tail_exhausts_the_budget_without_a_checkpoint() -> Result<(), Box<dyn Error>> {
    run_case("Этого блюда больше нет」}]}", false, false, false, None)
}

#[test]
fn length_limited_wrapper_loop_retries_once_then_commits_a_valid_answer()
-> Result<(), Box<dyn Error>> {
    for first in [
        runaway_candidate(),
        "{\"translations\":[{\"line_index\":0,\"segment_id\":72,\"text\":\"Ли Хуайбо」 } ] } } ] }".into(),
        "{\"translations\":[{\"line_index\":0,\"segment_id\":72,\"text\":\"Восемь десертов」}]}]]}}}}".into(),
    ] {
        run_case("Это блюдо нельзя найти в других местах.", true, true, false, Some(first))?;
    }
    Ok(())
}

#[test]
fn two_length_limited_wrapper_loops_save_no_checkpoint() -> Result<(), Box<dyn Error>> {
    run_case("", false, true, true, None)
}

#[test]
fn ordinary_length_limits_and_near_misses_remain_permanent() -> Result<(), Box<dyn Error>> {
    for (raw, profile_bytes) in [
        (candidate("Покажите литерал }]}"), LENGTH_PROFILE),
        (candidate("Он сказал 「да」 и продолжил."), LENGTH_PROFILE),
        (
            "{\"translations\":[{\"segment_id\":72,\"text\":\"Слово」}}}".into(),
            LENGTH_PROFILE,
        ),
        (runaway_candidate(), PROFILE),
    ] {
        let listener = TcpListener::bind("127.0.0.1:0")?;
        let address = listener.local_addr()?;
        let server = std::thread::spawn(move || -> Result<(), String> {
            let (mut stream, _) = listener.accept().map_err(|error| error.to_string())?;
            stream
                .set_read_timeout(Some(Duration::from_secs(5)))
                .map_err(|error| error.to_string())?;
            serve_response(&mut stream, &raw, "length")?;
            Ok(())
        });
        let mut profile: Value = serde_json::from_slice(profile_bytes)?;
        profile["context_before_segments"] = 0.into();
        profile["context_after_segments"] = 0.into();
        profile["max_context_bytes"] = 0.into();
        profile["token_safety_margin_tokens"] = Value::Null;
        let provider = LlamaCppProvider::new(
            &format!("http://{address}/"),
            ModelProfile::from_json(&serde_json::to_vec(&profile)?)?,
        )?;
        let batch = TranslationBatch::new(
            TranslationId::parse("11111111-1111-4111-8111-111111111111")?,
            RunId::parse("22222222-2222-4222-8222-222222222222")?,
            SourceHash::digest(b"length-near-miss-fixture"),
            LanguagePair::new(LanguageCode::Chinese, LanguageCode::Russian)?,
            vec![SourceSegment::new(
                SegmentId::new(72).ok_or("invalid ID")?,
                1000,
                2000,
                vec!["这道菜在外面吃不到。".into()],
            )?],
            Vec::new(),
        )?;
        assert!(matches!(
            provider.translate(&batch),
            Err(ProviderError::Permanent(_))
        ));
        server.join().map_err(|_| "server panicked")??;
    }
    Ok(())
}
