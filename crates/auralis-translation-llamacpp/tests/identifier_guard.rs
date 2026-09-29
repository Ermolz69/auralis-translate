use auralis_translation::{
    BlockCheckpoint, CheckpointStore, DiagnosticCode, InferenceRequestFinish,
    InferenceRequestJournal, InferenceRequestOutcome, InferenceRequestStart, LanguageCode,
    LanguagePair, RunId, SegmentId, SourceHash, SourceSegment, TranslationBatch, TranslationId,
    translate_planned_run,
};
use auralis_translation_llamacpp::{LlamaCppProvider, ModelProfile};
use serde_json::{Value, json};
use std::error::Error;
use std::io::{self, Read, Write};
use std::net::TcpListener;
use std::sync::{Arc, Mutex};

const GUARDED_PROFILE: &[u8] = include_bytes!(
    "../../../models/manifests/hy_mt2_1_8b_q4_k_m.context_v6_identifier_guard.experimental.json"
);
const LEGACY_PROFILE: &[u8] = include_bytes!(
    "../../../models/manifests/hy_mt2_1_8b_q4_k_m.context_v6_slot.experimental.json"
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

#[test]
fn guard_manifest_is_distinct_and_restricted_to_checked_v6() -> Result<(), Box<dyn Error>> {
    let strict = ModelProfile::from_json(GUARDED_PROFILE)?;
    let legacy = ModelProfile::from_json(LEGACY_PROFILE)?;
    assert!(strict.strict_source_identifiers);
    assert!(!legacy.strict_source_identifiers);
    assert_eq!(strict.prompt_version, legacy.prompt_version);
    let mut profile: Value = serde_json::from_slice(GUARDED_PROFILE)?;
    profile["prompt_version"] = 5.into();
    assert!(ModelProfile::from_json(&serde_json::to_vec(&profile)?).is_err());
    profile["prompt_version"] = 6.into();
    for key in [
        "model_file_bytes",
        "runtime_build_info",
        "min_context_tokens",
    ] {
        profile
            .as_object_mut()
            .ok_or("missing profile object")?
            .remove(key);
    }
    assert!(ModelProfile::from_json(&serde_json::to_vec(&profile)?).is_err());
    Ok(())
}

#[test]
fn strict_mismatch_stops_before_checkpoint_and_retains_raw_candidate() -> Result<(), Box<dyn Error>>
{
    for candidate in [
        "Не открывайте эту дверь.",
        "Проект AUR-0003: не открывайте эту дверь.",
        "Проект АУР-0002: не открывайте эту дверь.",
    ] {
        let (result, store, journal, request) = run_case(true, candidate)?;
        assert!(result.is_err());
        assert!(store.0.is_empty());
        let finish = journal.0.lock().map_err(|_| "journal poisoned")?;
        assert_eq!(finish.len(), 1);
        assert_eq!(finish[0].outcome, InferenceRequestOutcome::InvalidCandidate);
        assert_eq!(finish[0].restored_candidate.as_deref(), Some(candidate));
        assert!(finish[0].raw_response.is_some());
        assert!(
            finish[0]
                .error_detail
                .as_deref()
                .is_some_and(|detail| detail.contains("source identifier mismatch"))
        );
        assert!(
            !request["messages"][0]["content"]
                .as_str()
                .ok_or("missing prompt")?
                .contains("Не открывайте эту дверь.")
        );
    }
    Ok(())
}

#[test]
fn exact_code_passes_and_legacy_profile_keeps_advisory_warning() -> Result<(), Box<dyn Error>> {
    let (strict_result, strict_store, strict_journal, _) =
        run_case(true, "Проект AUR-0002: не открывайте эту дверь.")?;
    assert_eq!(
        strict_result?[0].lines,
        ["Проект AUR-0002: не открывайте эту дверь."]
    );
    assert_eq!(strict_store.0.len(), 1);
    assert!(strict_store.0[0].diagnostics.is_empty());
    assert_eq!(
        strict_journal.0.lock().map_err(|_| "journal poisoned")?[0].outcome,
        InferenceRequestOutcome::ValidatedLine
    );

    let (legacy_result, legacy_store, legacy_journal, _) =
        run_case(false, "Не открывайте эту дверь.")?;
    assert_eq!(legacy_result?[0].lines, ["Не открывайте эту дверь."]);
    assert_eq!(legacy_store.0.len(), 1);
    assert_eq!(
        legacy_store.0[0].diagnostics[0].code,
        DiagnosticCode::IdentifierMismatch
    );
    assert_eq!(
        legacy_journal.0.lock().map_err(|_| "journal poisoned")?[0].outcome,
        InferenceRequestOutcome::ValidatedLine
    );
    Ok(())
}

type CaseOutcome = (
    Result<Vec<auralis_translation::TargetSegment>, Box<dyn Error>>,
    MemoryStore,
    Arc<MemoryJournal>,
    Value,
);

fn run_case(strict: bool, candidate: &str) -> Result<CaseOutcome, Box<dyn Error>> {
    let listener = TcpListener::bind("127.0.0.1:0")?;
    let address = listener.local_addr()?;
    let response_text = candidate.to_owned();
    let server = std::thread::spawn(move || -> Result<Value, String> {
        let (mut stream, _) = listener.accept().map_err(|error| error.to_string())?;
        stream
            .set_read_timeout(Some(std::time::Duration::from_secs(5)))
            .map_err(|error| error.to_string())?;
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
        let raw = json!({"translations":[{"segment_id":2,"line_index":0,"text":response_text}]})
            .to_string();
        let body =
            json!({"choices":[{"message":{"content":raw},"finish_reason":"stop"}]}).to_string();
        write!(
            stream,
            "HTTP/1.1 200 OK\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}",
            body.len()
        )
        .map_err(|error| error.to_string())?;
        Ok(request)
    });
    let mut profile: Value = serde_json::from_slice(if strict {
        GUARDED_PROFILE
    } else {
        LEGACY_PROFILE
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
    let target_id = SegmentId::new(2).ok_or("invalid target ID")?;
    let batch = TranslationBatch::new(
        TranslationId::parse("11111111-1111-4111-8111-111111111111")?,
        RunId::parse("22222222-2222-4222-8222-222222222222")?,
        SourceHash::digest(b"identifier-guard-fixture"),
        LanguagePair::new(LanguageCode::Chinese, LanguageCode::Russian)?,
        vec![SourceSegment::new(
            target_id,
            1000,
            2000,
            vec!["工程 AUR-0002：不要打开这扇门。".into()],
        )?],
        vec![],
    )?;
    let mut store = MemoryStore::default();
    let result = translate_planned_run(&provider, &mut store, &[vec![target_id]], &[batch])
        .map_err(|error| -> Box<dyn Error> { Box::new(error) });
    let request = server.join().map_err(|_| "server panicked")??;
    Ok((result, store, journal, request))
}
