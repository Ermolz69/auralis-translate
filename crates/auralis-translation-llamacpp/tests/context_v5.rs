use auralis_translation::{
    LanguageCode, LanguagePair, RunId, SegmentId, SourceHash, SourceSegment, TranslationBatch,
    TranslationId, translate_batch,
};
use auralis_translation_llamacpp::{LlamaCppProvider, ModelProfile};
use serde_json::Value;
use std::error::Error;
use std::io::{Read, Write};
use std::net::TcpListener;
use std::time::Duration;

const PROFILE: &[u8] =
    include_bytes!("../../../models/manifests/hy_mt2_1_8b_q4_k_m.context_v5.experimental.json");

#[test]
fn v5_sends_only_source_slots_and_restores_protected_money() -> Result<(), Box<dyn Error>> {
    let listener = TcpListener::bind("127.0.0.1:0")?;
    let address = listener.local_addr()?;
    let server = std::thread::spawn(move || {
        serve(
            &listener,
            r#"{"translations":[{"segment_id":2,"line_index":0,"text":"Вода стоит __AURALIS_MONEY_0__."}]}"#,
        )
    });
    let mut profile: Value = serde_json::from_slice(PROFILE)?;
    profile["context_before_segments"] = 1.into();
    profile["max_context_bytes"] = 4096.into();
    let provider = LlamaCppProvider::new(
        &format!("http://{address}/"),
        ModelProfile::from_json(&serde_json::to_vec(&profile)?)?,
    )?;
    let result = translate_batch(&provider, &batch(true)?)?;
    assert_eq!(result[0].lines, ["Вода стоит 3 юаня."]);
    let request = server.join().map_err(|_| "server panicked")??;
    assert_eq!(request["response_format"]["type"], "json_object");
    assert_eq!(
        request["response_format"]["schema"]["properties"]["translations"]["minItems"],
        1
    );
    let content = request["messages"][0]["content"]
        .as_str()
        .ok_or("missing prompt")?;
    let envelope: Value = serde_json::from_str(
        content
            .split_once("Input JSON:\n")
            .ok_or("missing envelope")?
            .1,
    )?;
    assert_eq!(envelope["schema_version"], 5);
    assert_eq!(
        envelope["target_slots"].as_array().ok_or("no slots")?.len(),
        1
    );
    assert_eq!(envelope["target_slots"][0]["segment_id"], 2);
    assert_eq!(envelope["target_slots"][0]["line_index"], 0);
    assert_eq!(
        envelope["target_slots"][0]["source_original"],
        "这瓶水三元。"
    );
    assert_eq!(
        envelope["target_slots"][0]["source_for_translation"],
        "这瓶水__AURALIS_MONEY_0__。"
    );
    assert_eq!(envelope["protected_facts"][0]["original_span"], "三元");
    assert_eq!(envelope["protected_facts"][0]["normalized_ru"], "3 юаня");
    assert_eq!(envelope["source_context"][0]["segment_id"], 1);
    assert_eq!(envelope["source_context"][0]["lines"][0], "她正在买水。");
    assert_eq!(envelope["approved_terms"], serde_json::json!([]));
    assert!(!content.contains("Вода стоит"));
    assert!(!content.contains("Russian text"));
    Ok(())
}

#[test]
fn v5_rejects_changed_slot_identity_and_extra_context_slot() -> Result<(), Box<dyn Error>> {
    for candidate in [
        r#"{"translations":[{"segment_id":1,"line_index":0,"text":"Она покупает воду."}]}"#,
        r#"{"translations":[{"segment_id":2,"line_index":1,"text":"Вода."}]}"#,
        r#"{"translations":[{"segment_id":2,"line_index":0,"text":"Вода."},{"segment_id":1,"line_index":0,"text":"Контекст."}]}"#,
        r#"{"translations":[]}"#,
    ] {
        assert_rejected(candidate)?;
    }
    Ok(())
}

#[test]
fn v5_rejects_duplicate_fields_prose_empty_text_and_token_changes() -> Result<(), Box<dyn Error>> {
    for candidate in [
        r#"{"translations":[],"translations":[{"segment_id":2,"line_index":0,"text":"Текст"}]}"#,
        r#"{"translations":[{"segment_id":2,"segment_id":2,"line_index":0,"text":"Текст"}]}"#,
        r#"{"translations":[{"segment_id":2,"line_index":0,"text":"Текст","extra":1}]}"#,
        r#"{"translations":[{"segment_id":2,"line_index":0,"text":"Текст"}]} trailing"#,
        r#"{"translations":[{"segment_id":2,"line_index":0,"text":"  "}]}"#,
        r#"{"translations":[{"segment_id":2,"line_index":0,"text":"Три юаня."}]}"#,
        r#"{"translations":[{"segment_id":2,"line_index":0,"text":"__AURALIS_MONEY_0__ __AURALIS_MONEY_0__"}]}"#,
    ] {
        assert_rejected(candidate)?;
    }
    Ok(())
}

#[test]
fn v5_requires_chinese_and_one_attempt() -> Result<(), Box<dyn Error>> {
    let mut value: Value = serde_json::from_slice(PROFILE)?;
    value["max_block_attempts"] = 2.into();
    assert!(ModelProfile::from_json(&serde_json::to_vec(&value)?).is_err());
    value["max_block_attempts"] = 1.into();
    value["prompt_template_sha256"] = "0".repeat(64).into();
    assert!(ModelProfile::from_json(&serde_json::to_vec(&value)?).is_err());
    let provider = LlamaCppProvider::new("http://127.0.0.1:1/", ModelProfile::from_json(PROFILE)?)?;
    let mut japanese = batch(false)?;
    japanese = TranslationBatch::new(
        japanese.translation_id(),
        japanese.run_id(),
        japanese.source_hash(),
        LanguagePair::new(LanguageCode::Japanese, LanguageCode::Russian)?,
        japanese.targets().to_vec(),
        Vec::new(),
    )?;
    assert!(translate_batch(&provider, &japanese).is_err());
    Ok(())
}

fn assert_rejected(candidate: &str) -> Result<(), Box<dyn Error>> {
    let listener = TcpListener::bind("127.0.0.1:0")?;
    let address = listener.local_addr()?;
    let response = candidate.to_owned();
    let server = std::thread::spawn(move || serve(&listener, &response));
    let provider = LlamaCppProvider::new(
        &format!("http://{address}/"),
        ModelProfile::from_json(PROFILE)?,
    )?;
    assert!(
        translate_batch(&provider, &batch(false)?).is_err(),
        "{candidate}"
    );
    server.join().map_err(|_| "server panicked")??;
    Ok(())
}

fn batch(with_context: bool) -> Result<TranslationBatch, Box<dyn Error>> {
    Ok(TranslationBatch::new(
        TranslationId::parse("11111111-1111-4111-8111-111111111111")?,
        RunId::parse("22222222-2222-4222-8222-222222222222")?,
        SourceHash::digest(b"source"),
        LanguagePair::new(LanguageCode::Chinese, LanguageCode::Russian)?,
        vec![SourceSegment::new(
            SegmentId::new(2).ok_or("invalid target ID")?,
            2000,
            3000,
            vec!["这瓶水三元。".into()],
        )?],
        if with_context {
            vec![SourceSegment::new(
                SegmentId::new(1).ok_or("invalid context ID")?,
                1000,
                2000,
                vec!["她正在买水。".into()],
            )?]
        } else {
            Vec::new()
        },
    )?)
}

fn serve(listener: &TcpListener, candidate: &str) -> Result<Value, String> {
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
            return Err("request ended early".into());
        }
        raw.extend_from_slice(&buffer[..count]);
        if let Some(header_end) = raw.windows(4).position(|bytes| bytes == b"\r\n\r\n") {
            let header = std::str::from_utf8(&raw[..header_end]).map_err(|e| e.to_string())?;
            let length = header
                .lines()
                .find_map(|line| {
                    line.to_ascii_lowercase()
                        .strip_prefix("content-length: ")
                        .and_then(|value| value.parse::<usize>().ok())
                })
                .ok_or("missing length")?;
            if raw.len() >= header_end + 4 + length {
                break (header_end, length);
            }
        }
    };
    let request: Value =
        serde_json::from_slice(&raw[header_end + 4..header_end + 4 + content_length])
            .map_err(|error| error.to_string())?;
    let body =
        serde_json::json!({"choices":[{"message":{"content":candidate},"finish_reason":"stop"}]})
            .to_string();
    let response = format!(
        "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}",
        body.len()
    );
    stream
        .write_all(response.as_bytes())
        .map_err(|error| error.to_string())?;
    Ok(request)
}
