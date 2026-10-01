use auralis_translation::{
    LanguageCode, LanguagePair, RunId, SegmentId, SourceHash, SourceSegment, TranslationBatch,
    TranslationId, TranslationProvider,
};
use auralis_translation_llamacpp::{LlamaCppProvider, ModelProfile};
use serde_json::{Value, json};
use std::error::Error;
use std::io::{Read, Write};
use std::net::TcpListener;

const PROFILE: &[u8] = include_bytes!(
    "../../../models/manifests/hy_mt2_1_8b_q4_k_m.context_v6_slot.experimental.json"
);

#[test]
fn v6_binds_the_target_in_schema_and_still_validates_untrusted_output() -> Result<(), Box<dyn Error>>
{
    for (candidate_id, line_index, text, accepted) in [
        (72, 0, "Это не последний поезд.", true),
        (73, 0, "Это не последний поезд.", false),
        (72, 1, "Это не последний поезд.", false),
        (72, 0, "Потребление 9 Вт」}]}", false),
        (72, 0, "Телефон」 } ] } ] }", false),
        (72, 0, "По сравнению с другими кухнями, кантонская кухня」}]}", false),
        (72, 0, "В основном это блюдо невозможно найти снаружи」}]}", false),
        (72, 0, "Кантонская кухня отличается вкусом.", true),
        (72, 0, "Это блюдо — местная особенность.", true),
        (72, 0, "Он сказал: 「да」, и поезд ушёл.", true),
        (72, 0, "Покажите литерал }]}", true),
        (72, 0, "Цитата 「да」 — ответ.", true),
    ] {
        let listener = TcpListener::bind("127.0.0.1:0")?;
        let address = listener.local_addr()?;
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
            let candidate = json!({"translations":[{"segment_id":candidate_id,"line_index":line_index,"text":text}]}).to_string();
            let body =
                json!({"choices":[{"message":{"content":candidate},"finish_reason":"stop"}]})
                    .to_string();
            write!(
                stream,
                "HTTP/1.1 200 OK\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}",
                body.len()
            )
            .map_err(|error| error.to_string())?;
            Ok(request)
        });
        let mut profile: Value = serde_json::from_slice(PROFILE)?;
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
            SourceHash::digest(b"v6-slot-fixture"),
            LanguagePair::new(LanguageCode::Chinese, LanguageCode::Russian)?,
            vec![SourceSegment::new(
                SegmentId::new(72).ok_or("invalid target ID")?,
                1000,
                2000,
                vec!["这不是最后一班车。".into()],
            )?],
            Vec::new(),
        )?;
        let result = provider.translate(&batch);
        assert_eq!(result.is_ok(), accepted);
        if text.contains('」') && !accepted {
            assert!(
                result
                    .as_ref()
                    .err()
                    .is_some_and(|error| error.to_string().contains("leaked JSON wrapper tail"))
            );
        }
        let request = server.join().map_err(|_| "server panicked")??;
        let properties = &request["response_format"]["schema"]["properties"]["translations"]["items"]
            ["properties"];
        assert_eq!(properties["segment_id"], json!({"const":72}));
        assert_eq!(properties["line_index"], json!({"const":0}));
        assert!(
            !request["messages"][0]["content"]
                .as_str()
                .ok_or("missing prompt")?
                .contains("Это не последний поезд.")
        );
    }
    Ok(())
}
