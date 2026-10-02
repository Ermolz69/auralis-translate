use auralis_translation::{
    InferenceRequestFinish, InferenceRequestJournal, InferenceRequestKind, InferenceRequestOutcome,
    InferenceRequestStart, LanguageCode, LanguagePair, RunId, SegmentId, SourceHash, SourceSegment,
    TranslationBatch, TranslationId, translate_batch,
};
use auralis_translation_llamacpp::{LlamaCppProvider, ModelProfile};
use serde_json::{Value, json};
use std::error::Error;
use std::io::{Read, Write};
use std::net::TcpListener;
use std::sync::{
    Arc, Mutex,
    atomic::{AtomicBool, Ordering},
};
use std::time::Duration;

const PROFILE: &[u8] = include_bytes!(
    "../../../models/manifests/hy_mt2_1_8b_q4_k_m.context_v7_batch4.experimental.json"
);

#[derive(Default)]
struct Journal {
    starts: Mutex<Vec<InferenceRequestStart>>,
    finishes: Mutex<Vec<InferenceRequestFinish>>,
}

impl InferenceRequestJournal for Journal {
    fn begin(&self, start: &InferenceRequestStart) -> Result<(), Box<dyn Error + Send + Sync>> {
        self.starts
            .lock()
            .map_err(|_| "journal lock")?
            .push(start.clone());
        Ok(())
    }
    fn finish(&self, finish: &InferenceRequestFinish) -> Result<(), Box<dyn Error + Send + Sync>> {
        self.finishes
            .lock()
            .map_err(|_| "journal lock")?
            .push(finish.clone());
        Ok(())
    }
}

#[derive(Clone, Copy)]
enum Reply {
    Exact,
    WrongId,
    Swapped,
    Missing,
    Duplicate,
    FailSecond,
    ContextMoney(&'static str),
}

#[derive(Clone, Copy)]
enum TokenCost {
    Small,
    ContextMustTrim,
    TooLarge,
}

type CapturedRequests = Vec<(String, Value)>;
type ServerHandle = std::thread::JoinHandle<Result<CapturedRequests, String>>;
type MockServer = (String, Arc<AtomicBool>, ServerHandle);

fn mock_server(reply: Reply, token_cost: TokenCost) -> Result<MockServer, Box<dyn Error>> {
    let listener = TcpListener::bind("127.0.0.1:0")?;
    let url = format!("http://{}/", listener.local_addr()?);
    listener.set_nonblocking(true)?;
    let stop = Arc::new(AtomicBool::new(false));
    let thread_stop = stop.clone();
    let handle = std::thread::spawn(move || {
        let mut requests = Vec::new();
        while !thread_stop.load(Ordering::SeqCst) {
            let (mut stream, _) = match listener.accept() {
                Ok(connection) => connection,
                Err(error) if error.kind() == std::io::ErrorKind::WouldBlock => {
                    std::thread::sleep(Duration::from_millis(1));
                    continue;
                }
                Err(error) => return Err(error.to_string()),
            };
            stream
                .set_nonblocking(false)
                .map_err(|error| error.to_string())?;
            stream
                .set_read_timeout(Some(Duration::from_secs(5)))
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
            let path = String::from_utf8_lossy(&bytes)
                .split_whitespace()
                .nth(1)
                .ok_or("missing HTTP path")?
                .to_owned();
            let request: Value = serde_json::from_slice(&bytes[header_end..header_end + length])
                .map_err(|error| error.to_string())?;
            let body = match path.as_str() {
                "/apply-template" => json!({"prompt": request["messages"][0]["content"]}),
                "/tokenize" => {
                    let prompt = request["content"]
                        .as_str()
                        .ok_or("missing rendered prompt")?;
                    let envelope = input_envelope(prompt)?;
                    let context_count = envelope["source_context"]
                        .as_array()
                        .ok_or("missing source context")?
                        .len();
                    let count = match token_cost {
                        TokenCost::Small => 100,
                        TokenCost::ContextMustTrim if context_count > 0 => 1800,
                        TokenCost::ContextMustTrim => 100,
                        TokenCost::TooLarge => 3000,
                    };
                    json!({"tokens": vec![1; count]})
                }
                "/v1/chat/completions" => {
                    let chat_number = requests
                        .iter()
                        .filter(|(path, _)| path == "/v1/chat/completions")
                        .count();
                    let prompt = request["messages"][0]["content"]
                        .as_str()
                        .ok_or("missing chat prompt")?;
                    let envelope = input_envelope(prompt)?;
                    let targets = envelope["target_slots"]
                        .as_array()
                        .ok_or("missing targets")?;
                    let mut output = targets
                        .iter()
                        .map(|target| {
                            let source = target["source_for_translation"].as_str().unwrap_or("");
                            let text = if source.contains("__AURALIS_MONEY_0__") {
                                "Сумма __AURALIS_MONEY_0__.".to_owned()
                            } else {
                                format!("Строка {}-{}.", target["segment_id"], target["line_index"])
                            };
                            json!({"segment_id": target["segment_id"],
                            "line_index": target["line_index"], "text": text})
                        })
                        .collect::<Vec<_>>();
                    match reply {
                        Reply::Exact => {}
                        Reply::WrongId => output[0]["segment_id"] = 99.into(),
                        Reply::Swapped => output.swap(0, 1),
                        Reply::Missing => {
                            output.pop();
                        }
                        Reply::Duplicate => {
                            let first = output[0].clone();
                            output[1]["segment_id"] = first["segment_id"].clone();
                            output[1]["line_index"] = first["line_index"].clone();
                        }
                        Reply::FailSecond if chat_number == 1 => {
                            output[0]["segment_id"] = 99.into();
                        }
                        Reply::FailSecond => {}
                        Reply::ContextMoney(text) => {
                            output[0]["text"] = text.into();
                        }
                    }
                    let candidate = json!({"translations": output}).to_string();
                    json!({"choices":[{"message":{"content":candidate},"finish_reason":"stop"}],
                        "usage":{"prompt_tokens":100,"completion_tokens":20}})
                }
                _ => return Err(format!("unexpected path {path}")),
            };
            requests.push((path, request));
            let body = body.to_string();
            write!(stream, "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}", body.len())
                .map_err(|error| error.to_string())?;
        }
        Ok(requests)
    });
    Ok((url, stop, handle))
}

fn input_envelope(prompt: &str) -> Result<Value, String> {
    let (_, data) = prompt
        .split_once("Input JSON:\n")
        .ok_or("missing input JSON")?;
    serde_json::from_str(data).map_err(|error| error.to_string())
}

fn profile(targets: usize) -> Result<ModelProfile, Box<dyn Error>> {
    let mut value: Value = serde_json::from_slice(PROFILE)?;
    value["target_segments_per_block"] = targets.into();
    Ok(ModelProfile::from_json(&serde_json::to_vec(&value)?)?)
}

fn batch(
    target_count: u32,
    context_count: u32,
    multiline: bool,
) -> Result<TranslationBatch, Box<dyn Error>> {
    let targets = (1..=target_count)
        .map(|id| -> Result<SourceSegment, Box<dyn Error>> {
            let lines = if id == 2 && multiline {
                vec!["这碗面多少钱？十元。".into(), "不要加糖。".into()]
            } else {
                vec![format!("第{id}句。")]
            };
            Ok(SourceSegment::new(
                SegmentId::new(id).ok_or("invalid fixture ID")?,
                u64::from(id) * 1000,
                u64::from(id) * 1000 + 800,
                lines,
            )?)
        })
        .collect::<Result<Vec<_>, _>>()?;
    let context = (0..context_count)
        .map(|index| -> Result<SourceSegment, Box<dyn Error>> {
            let id = target_count + index + 1;
            Ok(SourceSegment::new(
                SegmentId::new(id).ok_or("invalid fixture ID")?,
                u64::from(id) * 1000,
                u64::from(id) * 1000 + 800,
                vec![format!("背景第{id}句。")],
            )?)
        })
        .collect::<Result<Vec<_>, _>>()?;
    Ok(TranslationBatch::new(
        TranslationId::parse("11111111-1111-4111-8111-111111111111")?,
        RunId::parse("22222222-2222-4222-8222-222222222222")?,
        SourceHash::digest(b"v7-batch-fixture"),
        LanguagePair::new(LanguageCode::Chinese, LanguageCode::Russian)?,
        targets,
        context,
    )?)
}

fn context_money_batch() -> Result<TranslationBatch, Box<dyn Error>> {
    Ok(TranslationBatch::new(
        TranslationId::parse("11111111-1111-4111-8111-111111111111")?,
        RunId::parse("22222222-2222-4222-8222-222222222222")?,
        SourceHash::digest(b"v7-context-money-regression"),
        LanguagePair::new(LanguageCode::Chinese, LanguageCode::Russian)?,
        vec![SourceSegment::new(
            SegmentId::new(1).ok_or("invalid ID")?,
            1000,
            2200,
            vec!["王经理说，明天不是星期五。".into()],
        )?],
        vec![SourceSegment::new(
            SegmentId::new(2).ok_or("invalid ID")?,
            2300,
            3500,
            vec!["这张票要十元，不要付一百元。".into()],
        )?],
    )?)
}

fn finish_server(
    stop: Arc<AtomicBool>,
    handle: std::thread::JoinHandle<Result<Vec<(String, Value)>, String>>,
) -> Result<Vec<(String, Value)>, Box<dyn Error>> {
    stop.store(true, Ordering::SeqCst);
    Ok(handle.join().map_err(|_| "server panicked")??)
}

#[test]
fn v7_maps_multiline_money_and_context_without_exposing_context_as_target()
-> Result<(), Box<dyn Error>> {
    let (url, stop, server) = mock_server(Reply::Exact, TokenCost::Small)?;
    let journal = Arc::new(Journal::default());
    let provider =
        LlamaCppProvider::new(&url, profile(4)?)?.with_inference_journal(journal.clone());
    let result = translate_batch(&provider, &batch(4, 1, true)?)?;
    assert_eq!(result.len(), 4);
    assert_eq!(result[1].lines.len(), 2);
    assert!(result[1].lines[0].contains("юан"));
    assert_eq!(result[1].lines[1], "Строка 2-1.");
    let requests = finish_server(stop, server)?;
    let chat = requests
        .iter()
        .filter(|(path, _)| path == "/v1/chat/completions")
        .collect::<Vec<_>>();
    assert_eq!(chat.len(), 1);
    let prompt = chat[0].1["messages"][0]["content"]
        .as_str()
        .ok_or("no prompt")?;
    let envelope = input_envelope(prompt)?;
    assert_eq!(
        envelope["target_slots"]
            .as_array()
            .ok_or("no targets")?
            .len(),
        5
    );
    assert_eq!(
        envelope["source_context"]
            .as_array()
            .ok_or("no context")?
            .len(),
        1
    );
    assert_eq!(envelope["source_context"][0]["segment_id"], 5);
    assert!(!prompt.contains("Строка 2-1."));
    assert_eq!(
        chat[0].1["response_format"]["schema"]["properties"]["translations"]["maxItems"],
        5
    );
    let starts = journal.starts.lock().map_err(|_| "journal lock")?;
    let finishes = journal.finishes.lock().map_err(|_| "journal lock")?;
    assert_eq!(starts.len(), 3);
    assert_eq!(
        starts.iter().map(|row| row.kind).collect::<Vec<_>>(),
        [
            InferenceRequestKind::ApplyTemplate,
            InferenceRequestKind::Tokenize,
            InferenceRequestKind::ChatCompletion
        ]
    );
    assert_eq!(finishes[2].outcome, InferenceRequestOutcome::ValidatedBatch);
    assert_eq!(
        serde_json::from_str::<Vec<String>>(
            finishes[2]
                .restored_candidate
                .as_deref()
                .ok_or("no candidate")?
        )?
        .len(),
        5
    );
    Ok(())
}

#[test]
fn v7_rejects_wrong_order_count_and_identity_before_acceptance() -> Result<(), Box<dyn Error>> {
    for reply in [
        Reply::WrongId,
        Reply::Swapped,
        Reply::Missing,
        Reply::Duplicate,
    ] {
        let (url, stop, server) = mock_server(reply, TokenCost::Small)?;
        let journal = Arc::new(Journal::default());
        let provider =
            LlamaCppProvider::new(&url, profile(4)?)?.with_inference_journal(journal.clone());
        assert!(translate_batch(&provider, &batch(4, 0, false)?).is_err());
        let requests = finish_server(stop, server)?;
        assert_eq!(
            requests
                .iter()
                .filter(|(path, _)| path == "/v1/chat/completions")
                .count(),
            1
        );
        let finishes = journal.finishes.lock().map_err(|_| "journal lock")?;
        assert_eq!(
            finishes.last().ok_or("no finish")?.outcome,
            InferenceRequestOutcome::InvalidCandidate
        );
        assert!(finishes.last().ok_or("no finish")?.raw_response.is_some());
    }
    Ok(())
}

#[test]
fn v7_splits_large_batch_and_uses_peer_sources_only_as_read_only_context()
-> Result<(), Box<dyn Error>> {
    let (url, stop, server) = mock_server(Reply::Exact, TokenCost::Small)?;
    let provider = LlamaCppProvider::new(&url, profile(8)?)?;
    let result = translate_batch(&provider, &batch(8, 0, false)?)?;
    assert_eq!(result.len(), 8);
    let requests = finish_server(stop, server)?;
    let chats = requests
        .iter()
        .filter(|(path, _)| path == "/v1/chat/completions")
        .map(|(_, request)| {
            input_envelope(request["messages"][0]["content"].as_str().unwrap_or(""))
        })
        .collect::<Result<Vec<_>, _>>()?;
    assert_eq!(chats.len(), 2);
    for (index, envelope) in chats.iter().enumerate() {
        let targets = envelope["target_slots"].as_array().ok_or("no targets")?;
        let context = envelope["source_context"].as_array().ok_or("no context")?;
        assert_eq!(targets.len(), 4);
        assert_eq!(context.len(), 4);
        assert_eq!(targets[0]["segment_id"], if index == 0 { 1 } else { 5 });
        assert_eq!(context[0]["segment_id"], if index == 0 { 5 } else { 1 });
    }
    Ok(())
}

#[test]
fn v7_discards_first_half_when_second_half_fails() -> Result<(), Box<dyn Error>> {
    let (url, stop, server) = mock_server(Reply::FailSecond, TokenCost::Small)?;
    let journal = Arc::new(Journal::default());
    let provider =
        LlamaCppProvider::new(&url, profile(8)?)?.with_inference_journal(journal.clone());
    assert!(translate_batch(&provider, &batch(8, 0, false)?).is_err());
    let requests = finish_server(stop, server)?;
    assert_eq!(
        requests
            .iter()
            .filter(|(path, _)| path == "/v1/chat/completions")
            .count(),
        2
    );
    let finishes = journal.finishes.lock().map_err(|_| "journal lock")?;
    let chat_finishes = finishes
        .iter()
        .filter(|finish| {
            matches!(
                finish.outcome,
                InferenceRequestOutcome::ValidatedBatch | InferenceRequestOutcome::InvalidCandidate
            )
        })
        .collect::<Vec<_>>();
    assert_eq!(chat_finishes.len(), 2);
    assert_eq!(
        chat_finishes[0].outcome,
        InferenceRequestOutcome::ValidatedBatch
    );
    assert_eq!(
        chat_finishes[1].outcome,
        InferenceRequestOutcome::InvalidCandidate
    );
    Ok(())
}

#[test]
fn v7_rejects_currency_copied_from_context_into_nonmoney_target() -> Result<(), Box<dyn Error>> {
    for text in [
        "Этот билет стоит десять юаней.",
        "Платить сто долларов не нужно.",
        "Здесь берут пять евро.",
    ] {
        let (url, stop, server) = mock_server(Reply::ContextMoney(text), TokenCost::Small)?;
        let journal = Arc::new(Journal::default());
        let provider =
            LlamaCppProvider::new(&url, profile(1)?)?.with_inference_journal(journal.clone());
        assert!(translate_batch(&provider, &context_money_batch()?).is_err());
        let requests = finish_server(stop, server)?;
        assert_eq!(
            requests
                .iter()
                .filter(|(path, _)| path == "/v1/chat/completions")
                .count(),
            1
        );
        let finishes = journal.finishes.lock().map_err(|_| "journal lock")?;
        assert_eq!(
            finishes.last().ok_or("no finish")?.outcome,
            InferenceRequestOutcome::InvalidCandidate
        );
        assert!(
            finishes
                .last()
                .ok_or("no finish")?
                .error_detail
                .as_deref()
                .unwrap_or("")
                .contains("currency absent")
        );
    }
    let (url, stop, server) = mock_server(
        Reply::ContextMoney("Это европейский менеджер."),
        TokenCost::Small,
    )?;
    let provider = LlamaCppProvider::new(&url, profile(1)?)?;
    assert_eq!(
        translate_batch(&provider, &context_money_batch()?)?[0].lines[0],
        "Это европейский менеджер."
    );
    finish_server(stop, server)?;
    Ok(())
}

#[test]
fn v7_trims_context_then_rejects_unsized_single_target_without_chat() -> Result<(), Box<dyn Error>>
{
    let (url, stop, server) = mock_server(Reply::Exact, TokenCost::ContextMustTrim)?;
    let provider = LlamaCppProvider::new(&url, profile(1)?)?;
    assert_eq!(translate_batch(&provider, &batch(1, 2, false)?)?.len(), 1);
    let requests = finish_server(stop, server)?;
    let chat = requests
        .iter()
        .find(|(path, _)| path == "/v1/chat/completions")
        .ok_or("missing chat")?;
    let envelope = input_envelope(
        chat.1["messages"][0]["content"]
            .as_str()
            .ok_or("no prompt")?,
    )?;
    assert_eq!(envelope["source_context"], json!([]));
    assert_eq!(
        requests
            .iter()
            .filter(|(path, _)| path == "/tokenize")
            .count(),
        3
    );

    let (url, stop, server) = mock_server(Reply::Exact, TokenCost::TooLarge)?;
    let provider = LlamaCppProvider::new(&url, profile(1)?)?;
    assert!(translate_batch(&provider, &batch(1, 0, false)?).is_err());
    let requests = finish_server(stop, server)?;
    assert_eq!(
        requests
            .iter()
            .filter(|(path, _)| path == "/v1/chat/completions")
            .count(),
        0
    );
    Ok(())
}
