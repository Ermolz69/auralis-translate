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
const PREFIX_REPAIR_PROFILE: &[u8] = include_bytes!(
    "../../../models/manifests/hy_mt2_1_8b_q4_k_m.context_v6_prefix_repair.experimental.json"
);
const PREFIX_REPAIR_V2_PROFILE: &[u8] = include_bytes!(
    "../../../models/manifests/hy_mt2_1_8b_q4_k_m.context_v6_prefix_repair_v2.experimental.json"
);
const PREFIX_REPAIR_V3_PROFILE: &[u8] = include_bytes!(
    "../../../models/manifests/hy_mt2_1_8b_q4_k_m.context_v6_prefix_repair_v3.experimental.json"
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
fn prefix_repair_manifest_requires_checked_strict_v6() -> Result<(), Box<dyn Error>> {
    let profile = ModelProfile::from_json(PREFIX_REPAIR_PROFILE)?;
    assert!(profile.strict_source_identifiers);
    assert!(profile.source_prefix_repair);
    assert_eq!(profile.prompt_version, 6);
    let legacy = ModelProfile::from_json(GUARDED_PROFILE)?;
    assert!(!legacy.source_prefix_repair);
    for (field, value) in [
        ("strict_source_identifiers", json!(false)),
        ("prompt_version", json!(5)),
        ("model_file_bytes", Value::Null),
    ] {
        let mut changed: Value = serde_json::from_slice(PREFIX_REPAIR_PROFILE)?;
        changed[field] = value;
        assert!(ModelProfile::from_json(&serde_json::to_vec(&changed)?).is_err());
    }
    let source = "工程 AUR-0089：列车将在 08:10 出发。";
    let candidate = "Поезд отправится в 08:10.";
    let (_, _, _, v1_request) = run_case_with_profile(PREFIX_REPAIR_PROFILE, source, candidate)?;
    let (_, _, _, v2_request) = run_case_with_profile(PREFIX_REPAIR_V2_PROFILE, source, candidate)?;
    assert_eq!(v1_request, v2_request);
    Ok(())
}

#[test]
fn prefix_repair_v2_manifest_is_exclusive_and_checked() -> Result<(), Box<dyn Error>> {
    let profile = ModelProfile::from_json(PREFIX_REPAIR_V2_PROFILE)?;
    assert!(profile.source_prefix_repair_v2);
    assert!(!profile.source_prefix_repair);
    assert!(profile.strict_source_identifiers);
    let legacy = ModelProfile::from_json(PREFIX_REPAIR_PROFILE)?;
    assert!(!legacy.source_prefix_repair_v2);
    for (field, value) in [
        ("source_prefix_repair", json!(true)),
        ("strict_source_identifiers", json!(false)),
        ("prompt_version", json!(5)),
        ("model_file_bytes", Value::Null),
    ] {
        let mut changed: Value = serde_json::from_slice(PREFIX_REPAIR_V2_PROFILE)?;
        changed[field] = value;
        assert!(ModelProfile::from_json(&serde_json::to_vec(&changed)?).is_err());
    }
    Ok(())
}

#[test]
fn missing_code_is_inserted_with_a_durable_review_flag_and_unchanged_prompt()
-> Result<(), Box<dyn Error>> {
    let source = "工程 AUR-0002：不要打开这扇门。";
    let candidate = "Не открывайте эту дверь.";
    let (baseline, baseline_store, _, baseline_request) = run_case(true, candidate)?;
    assert!(baseline.is_err());
    assert!(baseline_store.0.is_empty());

    let (result, store, journal, request) =
        run_case_with_profile(PREFIX_REPAIR_PROFILE, source, candidate)?;
    assert_eq!(request, baseline_request);
    assert_eq!(result?[0].lines, ["AUR-0002: Не открывайте эту дверь."]);
    assert_eq!(store.0.len(), 1);
    assert_eq!(store.0[0].diagnostics.len(), 1);
    assert_eq!(
        store.0[0].diagnostics[0].code,
        DiagnosticCode::SourcePrefixInserted
    );
    let attempts = journal.0.lock().map_err(|_| "journal poisoned")?;
    assert_eq!(attempts.len(), 1);
    assert_eq!(attempts[0].restored_candidate.as_deref(), Some(candidate));
    assert!(attempts[0].raw_response.is_some());
    assert_eq!(attempts[0].outcome, InferenceRequestOutcome::ValidatedLine);
    Ok(())
}

#[test]
fn insertion_preserves_candidate_facts_and_accepts_the_exact_prefix_limit()
-> Result<(), Box<dyn Error>> {
    let prefix = format!("{} AUR-0002", "工".repeat(71));
    assert_eq!(prefix.chars().count(), 80);
    let source = format!("{prefix}：不要在 08:10 开门。");
    let candidate = "Не открывайте дверь до 08:10; сохраните 12,00 руб.";
    let (result, store, journal, _) =
        run_case_with_profile(PREFIX_REPAIR_PROFILE, &source, candidate)?;
    assert_eq!(result?[0].lines, [format!("AUR-0002: {candidate}")]);
    assert_eq!(
        store.0[0].diagnostics[0].code,
        DiagnosticCode::SourcePrefixInserted
    );
    assert_eq!(
        journal.0.lock().map_err(|_| "journal poisoned")?[0]
            .restored_candidate
            .as_deref(),
        Some(candidate)
    );
    Ok(())
}

#[test]
fn exact_or_noncode_candidates_are_not_changed() -> Result<(), Box<dyn Error>> {
    for (source, candidate) in [
        (
            "工程 AUR-0002：不要打开这扇门。",
            "Проект AUR-0002: не открывайте эту дверь.",
        ),
        ("列车将在 08:10 出发。", "Поезд отправится в 08:10."),
        (
            "工程 AUR-0002：08:10 不要打开这扇门。",
            "AUR-0002: в 08:10 не открывайте эту дверь.",
        ),
    ] {
        let (result, store, journal, _) =
            run_case_with_profile(PREFIX_REPAIR_PROFILE, source, candidate)?;
        assert_eq!(result?[0].lines, [candidate]);
        assert_eq!(store.0.len(), 1);
        assert!(store.0[0].diagnostics.is_empty());
        assert_eq!(
            journal.0.lock().map_err(|_| "journal poisoned")?[0]
                .restored_candidate
                .as_deref(),
            Some(candidate)
        );
    }
    Ok(())
}

#[test]
fn ambiguous_codes_and_nonprefix_sources_still_fail_without_a_checkpoint()
-> Result<(), Box<dyn Error>> {
    let long_prefix = format!("{} AUR-0002：不要打开这扇门。", "工".repeat(81));
    for (source, candidate) in [
        (
            "工程 AUR-0002：不要打开这扇门。",
            "Проект AUR-0003: не открывайте эту дверь.",
        ),
        (
            "工程 AUR-0002：不要打开这扇门。",
            "Проект АУР-0002: не открывайте эту дверь.",
        ),
        (
            "工程 AUR-0002：不要打开这扇门。",
            "AUR-0002 и AUR-0002: не открывайте эту дверь.",
        ),
        ("工程 AUR-0002 与 DOC-42：已检查。", "Проверено."),
        ("工程 AUR-0002 不要打开这扇门。", "Не открывайте эту дверь."),
        (
            "工程：AUR-0002 不要打开这扇门。",
            "Не открывайте эту дверь.",
        ),
        (&long_prefix, "Не открывайте эту дверь."),
    ] {
        let (result, store, journal, _) =
            run_case_with_profile(PREFIX_REPAIR_PROFILE, source, candidate)?;
        assert!(result.is_err(), "{source}");
        assert!(store.0.is_empty(), "{source}");
        assert_eq!(
            journal.0.lock().map_err(|_| "journal poisoned")?[0]
                .restored_candidate
                .as_deref(),
            Some(candidate)
        );
    }
    Ok(())
}

#[test]
fn real_cyrillic_transposition_stays_rejected_with_related_and_negative_controls()
-> Result<(), Box<dyn Error>> {
    let source = "工程 AUR-0089：列车将在 08:10 出发。";
    for candidate in [
        "АРУ-0089: Поезд отправится в 08:10.",
        "АУР-0089: Поезд отправится в 08:10.",
        "АРУ-0090: Поезд отправится в 08:10.",
        "AUR-0090: Поезд отправится в 08:10.",
        "AUR-0089 и AUR-0089: Поезд отправится в 08:10.",
    ] {
        let (result, store, journal, _) =
            run_case_with_profile(PREFIX_REPAIR_PROFILE, source, candidate)?;
        assert!(result.is_err(), "{candidate}");
        assert!(store.0.is_empty(), "{candidate}");
        let attempts = journal.0.lock().map_err(|_| "journal poisoned")?;
        assert_eq!(
            attempts[0].outcome,
            InferenceRequestOutcome::InvalidCandidate
        );
        assert_eq!(attempts[0].restored_candidate.as_deref(), Some(candidate));
        assert!(attempts[0].raw_response.is_some());
    }
    let (exact, store, _, _) = run_case_with_profile(
        PREFIX_REPAIR_PROFILE,
        source,
        "AUR-0089: Поезд отправится в 08:10.",
    )?;
    assert_eq!(exact?[0].lines, ["AUR-0089: Поезд отправится в 08:10."]);
    assert!(store.0[0].diagnostics.is_empty());
    let (omitted, store, _, _) =
        run_case_with_profile(PREFIX_REPAIR_PROFILE, source, "Поезд отправится в 08:10.")?;
    assert_eq!(omitted?[0].lines, ["AUR-0089: Поезд отправится в 08:10."]);
    assert_eq!(
        store.0[0].diagnostics[0].code,
        DiagnosticCode::SourcePrefixInserted
    );
    {
        let candidate = "DOC-42: Поезд отправится в 08:10.";
        let (result, store, journal, _) =
            run_case_with_profile(PREFIX_REPAIR_PROFILE, source, candidate)?;
        assert!(result.is_err(), "{candidate}");
        assert!(store.0.is_empty(), "{candidate}");
        assert_eq!(
            journal.0.lock().map_err(|_| "journal poisoned")?[0]
                .restored_candidate
                .as_deref(),
            Some(candidate)
        );
    }
    let (no_code, store, _, _) = run_case_with_profile(
        PREFIX_REPAIR_PROFILE,
        "列车将在 08:10 出发。",
        "Поезд отправится в 08:10.",
    )?;
    assert_eq!(no_code?[0].lines, ["Поезд отправится в 08:10."]);
    assert!(store.0[0].diagnostics.is_empty());
    Ok(())
}

#[test]
fn strict_time_profile_rejects_changed_or_missing_clock_time_before_checkpoint()
-> Result<(), Box<dyn Error>> {
    let source = "工程 AUR-0089：列车将在 08:10 出发。";
    let profile = ModelProfile::from_json(PREFIX_REPAIR_V3_PROFILE)?;
    assert!(profile.source_prefix_repair_v2);
    assert!(profile.strict_source_times);
    assert!(!ModelProfile::from_json(PREFIX_REPAIR_V2_PROFILE)?.strict_source_times);
    let mut invalid: Value = serde_json::from_slice(PREFIX_REPAIR_PROFILE)?;
    invalid["strict_source_times"] = json!(true);
    assert!(ModelProfile::from_json(&serde_json::to_vec(&invalid)?).is_err());
    for candidate in [
        "Поезд отправится в 08:11.",
        "Поезд отправится.",
        "Поезд отправится в 08:10 и 08:10.",
    ] {
        let (legacy, legacy_store, _, legacy_request) =
            run_case_with_profile(PREFIX_REPAIR_V2_PROFILE, source, candidate)?;
        assert!(legacy.is_ok(), "{candidate}");
        assert_eq!(legacy_store.0.len(), 1);
        assert!(
            legacy_store.0[0]
                .diagnostics
                .iter()
                .any(|diagnostic| diagnostic.code == DiagnosticCode::TimeMismatch)
        );
        let (strict, strict_store, journal, strict_request) =
            run_case_with_profile(PREFIX_REPAIR_V3_PROFILE, source, candidate)?;
        assert_eq!(legacy_request, strict_request);
        assert!(strict.is_err(), "{candidate}");
        assert!(strict_store.0.is_empty(), "{candidate}");
        let attempts = journal.0.lock().map_err(|_| "journal poisoned")?;
        assert_eq!(
            attempts[0].outcome,
            InferenceRequestOutcome::InvalidCandidate
        );
        assert_eq!(attempts[0].restored_candidate.as_deref(), Some(candidate));
        assert!(attempts[0].raw_response.is_some());
    }
    for candidate in ["Поезд отправится в 08:10.", "Поезд отправится в 8:10."]
    {
        let (accepted, store, _, _) =
            run_case_with_profile(PREFIX_REPAIR_V3_PROFILE, source, candidate)?;
        assert!(accepted.is_ok(), "{candidate}");
        assert_eq!(store.0.len(), 1);
        assert!(
            !store.0[0]
                .diagnostics
                .iter()
                .any(|diagnostic| diagnostic.code == DiagnosticCode::TimeMismatch)
        );
    }
    let (exact, exact_store, _, _) = run_case_with_profile(
        PREFIX_REPAIR_V3_PROFILE,
        source,
        "AUR-0089: Поезд отправится в 08:10.",
    )?;
    assert!(exact.is_ok());
    assert!(exact_store.0[0].diagnostics.is_empty());
    let (no_code, no_code_store, _, _) = run_case_with_profile(
        PREFIX_REPAIR_V3_PROFILE,
        "列车将在 08:10 出发。",
        "Поезд отправится в 08:10.",
    )?;
    assert!(no_code.is_ok());
    assert!(no_code_store.0[0].diagnostics.is_empty());
    Ok(())
}

#[test]
fn mixed_script_identifier_v1_reproduction_and_v2_controls() -> Result<(), Box<dyn Error>> {
    let source = "工程 AUR-0089：列车将在 08:10 出发。";
    let candidate = "АUR-0089: Поезд отправится в 08:10.";
    let (legacy, legacy_store, _, _) =
        run_case_with_profile(PREFIX_REPAIR_PROFILE, source, candidate)?;
    assert_eq!(legacy?[0].lines, [format!("AUR-0089: {candidate}")]);
    assert_eq!(
        legacy_store.0[0].diagnostics[0].code,
        DiagnosticCode::SourcePrefixInserted
    );
    for candidate in [
        "АUR-0089: Поезд отправится в 08:10.",
        "AUР-0089: Поезд отправится в 08:10.",
        "АРУ-0089: Поезд отправится в 08:10.",
        "АUR-0090: Поезд отправится в 08:10.",
        "АBC-42: Поезд отправится в 08:10.",
        "AUR-0089: АUR-0089: Поезд отправится в 08:10.",
    ] {
        let (result, store, journal, _) =
            run_case_with_profile(PREFIX_REPAIR_V2_PROFILE, source, candidate)?;
        assert!(result.is_err(), "{candidate}");
        assert!(store.0.is_empty(), "{candidate}");
        let attempts = journal.0.lock().map_err(|_| "journal poisoned")?;
        assert_eq!(
            attempts[0].outcome,
            InferenceRequestOutcome::InvalidCandidate
        );
        assert_eq!(attempts[0].restored_candidate.as_deref(), Some(candidate));
    }
    for (source, candidate, expected, flagged) in [
        (
            source,
            "AUR-0089: Поезд отправится в 08:10.",
            "AUR-0089: Поезд отправится в 08:10.",
            false,
        ),
        (
            source,
            "Поезд отправится в 08:10.",
            "AUR-0089: Поезд отправится в 08:10.",
            true,
        ),
        (
            "列车将在 08:10 出发。",
            "Поезд отправится в 08:10.",
            "Поезд отправится в 08:10.",
            false,
        ),
        (
            source,
            "АВТОР: поезд отправится в 08:10.",
            "AUR-0089: АВТОР: поезд отправится в 08:10.",
            true,
        ),
    ] {
        let (result, store, _, _) =
            run_case_with_profile(PREFIX_REPAIR_V2_PROFILE, source, candidate)?;
        assert_eq!(result?[0].lines, [expected]);
        assert_eq!(!store.0[0].diagnostics.is_empty(), flagged);
    }
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
    run_case_with_profile(
        if strict {
            GUARDED_PROFILE
        } else {
            LEGACY_PROFILE
        },
        "工程 AUR-0002：不要打开这扇门。",
        candidate,
    )
}

fn run_case_with_profile(
    profile_bytes: &[u8],
    source: &str,
    candidate: &str,
) -> Result<CaseOutcome, Box<dyn Error>> {
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
    let mut profile: Value = serde_json::from_slice(profile_bytes)?;
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
            vec![source.into()],
        )?],
        vec![],
    )?;
    let mut store = MemoryStore::default();
    let result = translate_planned_run(&provider, &mut store, &[vec![target_id]], &[batch])
        .map_err(|error| -> Box<dyn Error> { Box::new(error) });
    let request = server.join().map_err(|_| "server panicked")??;
    Ok((result, store, journal, request))
}
