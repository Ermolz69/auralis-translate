use auralis_translation::{
    ApprovedTerm, LanguageCode, LanguagePair, RunId, SegmentId, SourceHash, SourceSegment,
    TranslationBatch, TranslationId, translate_batch,
};
use auralis_translation_llamacpp::{LlamaCppProvider, ModelProfile};
use serde_json::Value;
use std::{
    error::Error,
    io::{Read, Write},
    net::TcpListener,
};

const PROFILE: &[u8] = include_bytes!(
    "../../../models/manifests/hy_mt2_1_8b_q4_k_m.context_v5_scene_terms.experimental.json"
);

fn batch() -> Result<TranslationBatch, Box<dyn Error>> {
    let target_id = SegmentId::new(2).ok_or("id")?;
    Ok(TranslationBatch::with_approved_terms(
        TranslationId::parse("11111111-1111-4111-8111-111111111111")?,
        RunId::parse("22222222-2222-4222-8222-222222222222")?,
        SourceHash::digest(b"source"),
        LanguagePair::new(LanguageCode::Chinese, LanguageCode::Russian)?,
        vec![SourceSegment::new(
            target_id,
            2000,
            3000,
            vec!["小王来了。".into()],
        )?],
        vec![SourceSegment::new(
            SegmentId::new(1).ok_or("id")?,
            1000,
            2000,
            vec!["小李在等。".into()],
        )?],
        vec![ApprovedTerm::new(
            "小王".into(),
            "Сяо Ван".into(),
            vec![],
            vec![target_id],
            "human-001".into(),
            "note-001".into(),
        )?],
    )?)
}

#[test]
fn sends_only_bounded_target_terms_and_provenance() -> Result<(), Box<dyn Error>> {
    let listener = TcpListener::bind("127.0.0.1:0")?;
    let address = listener.local_addr()?;
    let server = std::thread::spawn(move || serve(&listener));
    let provider = LlamaCppProvider::new(
        &format!("http://{address}/"),
        ModelProfile::from_json(PROFILE)?,
    )?;
    let result = translate_batch(&provider, &batch()?)?;
    assert_eq!(result[0].lines, ["Сяо Ван пришёл."]);
    let (request, preflight) = server.join().map_err(|_| "server panicked")??;
    assert_eq!(preflight, 2);
    let content = request["messages"][0]["content"].as_str().ok_or("prompt")?;
    let envelope: Value =
        serde_json::from_str(content.split_once("Input JSON:\n").ok_or("envelope")?.1)?;
    assert_eq!(envelope["approved_terms"][0]["source"], "小王");
    assert_eq!(envelope["approved_terms"][0]["target"], "Сяо Ван");
    assert_eq!(envelope["approved_terms"][0]["reviewer_id"], "human-001");
    assert_eq!(
        envelope["approved_terms"].as_array().ok_or("array")?.len(),
        1
    );
    assert_eq!(envelope["source_context"][0]["lines"][0], "小李在等。");
    Ok(())
}

#[test]
fn rejects_terms_over_profile_limit_before_network() -> Result<(), Box<dyn Error>> {
    let mut profile: Value = serde_json::from_slice(PROFILE)?;
    profile["max_approved_terms_entries"] = 1.into();
    profile["max_approved_terms_bytes"] = 2.into();
    let provider = LlamaCppProvider::new(
        "http://127.0.0.1:1/",
        ModelProfile::from_json(&serde_json::to_vec(&profile)?)?,
    )?;
    assert!(translate_batch(&provider, &batch()?).is_err());
    Ok(())
}

#[test]
fn term_profile_requires_rendered_token_reserve_even_without_context() -> Result<(), Box<dyn Error>>
{
    let mut profile: Value = serde_json::from_slice(PROFILE)?;
    profile["context_before_segments"] = 0.into();
    profile["context_after_segments"] = 0.into();
    profile["token_safety_margin_tokens"] = Value::Null;
    assert!(ModelProfile::from_json(&serde_json::to_vec(&profile)?).is_err());
    Ok(())
}

fn serve(listener: &TcpListener) -> Result<(Value, usize), String> {
    let mut preflight = 0;
    loop {
        let (mut stream, _) = listener.accept().map_err(|e| e.to_string())?;
        let (path, request) = read_request(&mut stream)?;
        let body = match path.as_str() {
            "/apply-template" => {
                preflight += 1;
                serde_json::json!({"prompt":request["messages"][0]["content"]}).to_string()
            }
            "/tokenize" => {
                preflight += 1;
                if !request["content"].as_str().ok_or("rendered prompt")?.contains("Сяо Ван") {
                    return Err("approved term missing from rendered token input".into());
                }
                serde_json::json!({"tokens":(1..=40).collect::<Vec<_>>()}).to_string()
            }
            "/v1/chat/completions" => serde_json::json!({"choices":[{"message":{"content":"{\"translations\":[{\"segment_id\":2,\"line_index\":0,\"text\":\"Сяо Ван пришёл.\"}]}"},"finish_reason":"stop"}]}).to_string(),
            _ => return Err(format!("unexpected path: {path}")),
        };
        let response = format!(
            "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}",
            body.len()
        );
        stream
            .write_all(response.as_bytes())
            .map_err(|e| e.to_string())?;
        if path == "/v1/chat/completions" {
            return Ok((request, preflight));
        }
    }
}

fn read_request(stream: &mut std::net::TcpStream) -> Result<(String, Value), String> {
    let mut raw = Vec::new();
    let mut buffer = [0u8; 4096];
    let (start, length, path) = loop {
        let count = stream.read(&mut buffer).map_err(|e| e.to_string())?;
        if count == 0 {
            return Err("request ended early".into());
        }
        raw.extend_from_slice(&buffer[..count]);
        if let Some(start) = raw.windows(4).position(|bytes| bytes == b"\r\n\r\n") {
            let header = std::str::from_utf8(&raw[..start]).map_err(|e| e.to_string())?;
            if let Some(length) = header.lines().find_map(|line| {
                line.to_ascii_lowercase()
                    .strip_prefix("content-length: ")
                    .and_then(|v| v.parse::<usize>().ok())
            }) && raw.len() >= start + 4 + length
            {
                let path = header
                    .lines()
                    .next()
                    .and_then(|line| line.split_whitespace().nth(1))
                    .ok_or("request path")?
                    .to_owned();
                break (start + 4, length, path);
            }
        }
    };
    let request: Value =
        serde_json::from_slice(&raw[start..start + length]).map_err(|e| e.to_string())?;
    Ok((path, request))
}
