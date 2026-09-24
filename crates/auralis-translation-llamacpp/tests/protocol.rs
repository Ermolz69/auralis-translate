use auralis_translation::{
    LanguageCode, LanguagePair, RunId, SegmentId, SourceHash, SourceSegment, TranslationBatch,
    TranslationId, translate_batch,
};
use auralis_translation_llamacpp::{LlamaCppProvider, ModelProfile};
use std::error::Error;
use std::io::{Read, Write};
use std::net::TcpListener;
use std::time::Duration;

const PROFILE: &[u8] =
    include_bytes!("../../../models/manifests/hy_mt2_1_8b_q4_k_m.experimental.json");

#[test]
fn sends_one_line_to_local_chat_endpoint_and_accepts_response() -> Result<(), Box<dyn Error>> {
    let listener = TcpListener::bind("127.0.0.1:0")?;
    let address = listener.local_addr()?;
    let server = std::thread::spawn(move || serve_once(listener, "stop"));

    let profile = ModelProfile::from_json(PROFILE)?;
    let provider = LlamaCppProvider::new(&format!("http://{address}/"), profile)?;
    let translated = translate_batch(&provider, &batch()?)?;
    assert_eq!(translated[0].lines, ["Привет."]);

    let request = server.join().map_err(|_| "mock server panicked")??;
    assert_eq!(request["model"], "auralis-hy-mt2-1.8b-q4");
    assert_eq!(request["messages"][0]["role"], "user");
    assert!(
        request["messages"][0]["content"]
            .as_str()
            .ok_or("no prompt")?
            .contains("你好。")
    );
    assert_eq!(request["temperature"], 0.7);
    assert_eq!(request["stream"], false);
    Ok(())
}

#[test]
fn rejects_truncated_response_and_remote_endpoint() -> Result<(), Box<dyn Error>> {
    let profile = ModelProfile::from_json(PROFILE)?;
    assert!(LlamaCppProvider::new("https://example.com/", profile.clone()).is_err());
    let listener = TcpListener::bind("127.0.0.1:0")?;
    let address = listener.local_addr()?;
    let server = std::thread::spawn(move || serve_once(listener, "length"));
    let provider = LlamaCppProvider::new(&format!("http://{address}/"), profile)?;
    assert!(translate_batch(&provider, &batch()?).is_err());
    server.join().map_err(|_| "mock server panicked")??;
    Ok(())
}

fn batch() -> Result<TranslationBatch, Box<dyn Error>> {
    Ok(TranslationBatch::new(
        TranslationId::parse("11111111-1111-4111-8111-111111111111")?,
        RunId::parse("22222222-2222-4222-8222-222222222222")?,
        SourceHash::digest(b"source"),
        LanguagePair::new(LanguageCode::Chinese, LanguageCode::Russian)?,
        vec![SourceSegment::new(
            SegmentId::new(1).ok_or("invalid ID")?,
            1000,
            2000,
            vec!["你好。".into()],
        )?],
        Vec::new(),
    )?)
}

fn serve_once(listener: TcpListener, finish_reason: &str) -> Result<serde_json::Value, String> {
    let (mut stream, _) = listener.accept().map_err(|error| error.to_string())?;
    stream
        .set_read_timeout(Some(Duration::from_secs(5)))
        .map_err(|error| error.to_string())?;
    let mut raw = Vec::new();
    let mut buffer = [0u8; 4096];
    let (header_end, content_length) = loop {
        let count = stream
            .read(&mut buffer)
            .map_err(|error| error.to_string())?;
        if count == 0 {
            return Err("request ended before its body".into());
        }
        raw.extend_from_slice(&buffer[..count]);
        if let Some(header_end) = raw.windows(4).position(|window| window == b"\r\n\r\n") {
            let header =
                std::str::from_utf8(&raw[..header_end]).map_err(|error| error.to_string())?;
            let content_length = header
                .lines()
                .find_map(|line| {
                    line.to_ascii_lowercase()
                        .strip_prefix("content-length: ")
                        .and_then(|value| value.parse::<usize>().ok())
                })
                .ok_or("missing content length")?;
            if raw.len() >= header_end + 4 + content_length {
                break (header_end, content_length);
            }
        }
    };
    let header = std::str::from_utf8(&raw[..header_end]).map_err(|error| error.to_string())?;
    if !header.starts_with("POST /v1/chat/completions HTTP/1.1") {
        return Err("wrong endpoint".into());
    }
    let request = serde_json::from_slice(&raw[header_end + 4..header_end + 4 + content_length])
        .map_err(|error| error.to_string())?;
    let body = format!(
        r#"{{"choices":[{{"message":{{"content":"Привет."}},"finish_reason":"{finish_reason}"}}]}}"#
    );
    let response = format!(
        "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}",
        body.len()
    );
    stream
        .write_all(response.as_bytes())
        .map_err(|error| error.to_string())?;
    Ok(request)
}
