use auralis_translation::{
    GlossaryEntry, LanguageCode, LanguagePair, RunId, SegmentId, SourceHash, SourceSegment,
    TranslationBatch, TranslationId, translate_batch,
};
use auralis_translation_llamacpp::{LlamaCppProvider, ModelProfile};
use std::error::Error;
use std::io::{Read, Write};
use std::net::TcpListener;
use std::time::Duration;

const PROFILE: &[u8] =
    include_bytes!("../../../models/manifests/hy_mt2_1_8b_q4_k_m.experimental.json");
const CONTEXT_PROFILE: &[u8] =
    include_bytes!("../../../models/manifests/hy_mt2_1_8b_q4_k_m.context.experimental.json");
const GLOSSARY_PROFILE: &[u8] =
    include_bytes!("../../../models/manifests/hy_mt2_1_8b_q4_k_m.glossary.experimental.json");
const FIDELITY_PROFILE: &[u8] =
    include_bytes!("../../../models/manifests/hy_mt2_1_8b_q4_k_m.fidelity.experimental.json");

#[test]
fn fidelity_prompt_keeps_foreign_currency_source_and_rejects_japanese() -> Result<(), Box<dyn Error>>
{
    let listener = TcpListener::bind("127.0.0.1:0")?;
    let address = listener.local_addr()?;
    let server = std::thread::spawn(move || serve_once(&listener, "stop"));
    let profile = ModelProfile::from_json(FIDELITY_PROFILE)?;
    let provider = LlamaCppProvider::new(&format!("http://{address}/"), profile)?;
    let make_batch = |language, text: &str| {
        TranslationBatch::new(
            TranslationId::parse("11111111-1111-4111-8111-111111111111")?,
            RunId::parse("22222222-2222-4222-8222-222222222222")?,
            SourceHash::digest(text.as_bytes()),
            LanguagePair::new(language, LanguageCode::Russian)?,
            vec![SourceSegment::new(
                SegmentId::new(1).ok_or("invalid ID")?,
                1000,
                2000,
                vec![text.into()],
            )?],
            Vec::new(),
        )
        .map_err(|error| -> Box<dyn Error> { error.into() })
    };
    let japanese = make_batch(LanguageCode::Japanese, "これは五円です。")?;
    let collision = make_batch(LanguageCode::Chinese, "这瓶水三元 __AURALIS_MONEY_0__")?;
    assert!(
        translate_batch(&provider, &collision)
            .is_err_and(|error| error.to_string().contains("source collides"))
    );
    assert!(
        translate_batch(&provider, &japanese)
            .is_err_and(|error| error.to_string().contains("requires Chinese source"))
    );
    let source = "这瓶水五美元，桌上还有三块石头。";
    let translated = translate_batch(&provider, &make_batch(LanguageCode::Chinese, source)?)?;
    let request = server.join().map_err(|_| "mock server panicked")??;
    let prompt = request["messages"][0]["content"]
        .as_str()
        .ok_or("missing prompt")?;
    assert!(prompt.ends_with("这瓶水__AURALIS_MONEY_0__，桌上还有三块石头。"));
    assert!(translated[0].lines[0].contains("5 долларов"));
    assert!(!translated[0].lines[0].contains("__AURALIS_MONEY_"));
    assert!(!prompt.contains("юан"));
    assert_eq!(request["temperature"], 0.7);
    Ok(())
}

#[test]
fn currency_terms_preserve_amounts_and_do_not_reclassify_pieces() -> Result<(), Box<dyn Error>> {
    let cases = [
        (
            "这瓶水三块五，两瓶一共七块。",
            vec![
                "三块五 translates to 3,5 юаня",
                "七块 translates to 7 юаней",
            ],
        ),
        (
            "一共十二块八毛。",
            vec!["十二块八毛 translates to 12,8 юаня"],
        ),
        ("找你两毛钱。", vec!["两毛钱 translates to 0,2 юаня"]),
        (
            "价格是两元五角三分。",
            vec!["两元五角三分 translates to 2,53 юаня"],
        ),
        ("价格五角。", vec!["五角 translates to 0,5 юаня"]),
        (
            "价格一百零五元。",
            vec!["一百零五元 translates to 105 юаней"],
        ),
        (
            "价格一千零二元。",
            vec!["一千零二元 translates to 1002 юаня"],
        ),
        ("价格3.05元。", vec!["3.05元 translates to 3,05 юаня"]),
        (
            "一共三元，书十三元，还有三元。",
            vec![
                "三元 translates to 3 юаня",
                "十三元 translates to 13 юаней",
                "三元 translates to 3 юаня",
            ],
        ),
        ("这本书两百日元。", vec!["两百日元 translates to 200 иен"]),
        (
            "这本书十港元。",
            vec!["十港元 translates to 10 гонконгских долларов"],
        ),
        (
            "这件商品七谢克尔。",
            vec!["七谢克尔 translates to 7 шекелей"],
        ),
        ("价格负五元。", vec![]),
        ("价格-5元。", vec![]),
        ("价格一百五元。", vec![]),
        ("价格一万元。", vec![]),
        ("价格一万五元。", vec![]),
        ("价格1e3元。", vec![]),
        ("给我三块石头。", vec![]),
        ("把巧克力分成四块。", vec![]),
        ("我们还剩五分钟。", vec![]),
        ("桌上五角星。", vec![]),
    ];
    let listener = TcpListener::bind("127.0.0.1:0")?;
    let address = listener.local_addr()?;
    let count = cases.len();
    let server = std::thread::spawn(move || -> Result<Vec<_>, String> {
        (0..count).map(|_| serve_once(&listener, "stop")).collect()
    });
    let provider = LlamaCppProvider::new(
        &format!("http://{address}/"),
        ModelProfile::from_json(FIDELITY_PROFILE)?,
    )?;
    let mut translated = Vec::new();
    for (text, _) in &cases {
        let source = TranslationBatch::new(
            TranslationId::parse("11111111-1111-4111-8111-111111111111")?,
            RunId::parse("22222222-2222-4222-8222-222222222222")?,
            SourceHash::digest(text.as_bytes()),
            LanguagePair::new(LanguageCode::Chinese, LanguageCode::Russian)?,
            vec![SourceSegment::new(
                SegmentId::new(1).ok_or("invalid ID")?,
                1000,
                2000,
                vec![(*text).into()],
            )?],
            Vec::new(),
        )?;
        translated.push(translate_batch(&provider, &source)?[0].lines[0].clone());
    }
    for ((source, terms), request) in cases
        .iter()
        .zip(server.join().map_err(|_| "mock server panicked")??)
    {
        let prompt = request["messages"][0]["content"]
            .as_str()
            .ok_or("missing prompt")?;
        let index = cases
            .iter()
            .position(|(text, _)| text == source)
            .ok_or("case missing")?;
        if terms.is_empty() {
            assert!(prompt.ends_with(&format!("\n{source}")));
            assert!(!prompt.contains("__AURALIS_MONEY_"));
        } else {
            for (token_index, term) in terms.iter().enumerate() {
                assert!(
                    prompt.contains(&format!("__AURALIS_MONEY_{token_index}__")),
                    "{source}: {prompt}"
                );
                let target = term
                    .split(" translates to ")
                    .nth(1)
                    .ok_or("target missing")?;
                assert!(
                    translated[index].contains(target),
                    "{source}: {}",
                    translated[index]
                );
            }
        }
    }
    Ok(())
}

#[test]
fn sends_one_line_to_local_chat_endpoint_and_accepts_response() -> Result<(), Box<dyn Error>> {
    let listener = TcpListener::bind("127.0.0.1:0")?;
    let address = listener.local_addr()?;
    let server = std::thread::spawn(move || serve_once(&listener, "stop"));

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
fn fidelity_rejects_lost_duplicated_reordered_and_invented_money_tokens()
-> Result<(), Box<dyn Error>> {
    let source = TranslationBatch::new(
        TranslationId::parse("11111111-1111-4111-8111-111111111111")?,
        RunId::parse("22222222-2222-4222-8222-222222222222")?,
        SourceHash::digest(b"money"),
        LanguagePair::new(LanguageCode::Chinese, LanguageCode::Russian)?,
        vec![SourceSegment::new(
            SegmentId::new(1).ok_or("invalid ID")?,
            1000,
            2000,
            vec!["这瓶水三块五，两瓶一共七块。".into()],
        )?],
        Vec::new(),
    )?;
    for candidate in [
        "Три шиллинга.",
        "__AURALIS_MONEY_0__ __AURALIS_MONEY_0__ __AURALIS_MONEY_1__",
        "__AURALIS_MONEY_1__ __AURALIS_MONEY_0__",
        "__AURALIS_MONEY_0__ __AURALIS_MONEY_1__ __AURALIS_MONEY_9__",
        "__AURALIS_MONEY_O__ __AURALIS_MONEY_1__",
    ] {
        let listener = TcpListener::bind("127.0.0.1:0")?;
        let address = listener.local_addr()?;
        let server =
            std::thread::spawn(move || serve_candidate(&listener, "stop", Some(candidate)));
        let provider = LlamaCppProvider::new(
            &format!("http://{address}/"),
            ModelProfile::from_json(FIDELITY_PROFILE)?,
        )?;
        assert!(translate_batch(&provider, &source).is_err(), "{candidate}");
        server.join().map_err(|_| "mock server panicked")??;
    }
    let listener = TcpListener::bind("127.0.0.1:0")?;
    let address = listener.local_addr()?;
    let server = std::thread::spawn(move || {
        serve_candidate(
            &listener,
            "stop",
            Some("Цена__AURALIS_MONEY_0__и__AURALIS_MONEY_1__."),
        )
    });
    let provider = LlamaCppProvider::new(
        &format!("http://{address}/"),
        ModelProfile::from_json(FIDELITY_PROFILE)?,
    )?;
    assert_eq!(
        translate_batch(&provider, &source)?[0].lines[0],
        "Цена 3,5 юаня и 7 юаней."
    );
    server.join().map_err(|_| "mock server panicked")??;
    Ok(())
}

#[test]
fn rejects_truncated_response_and_remote_endpoint() -> Result<(), Box<dyn Error>> {
    let profile = ModelProfile::from_json(PROFILE)?;
    assert!(LlamaCppProvider::new("https://example.com/", profile.clone()).is_err());
    let listener = TcpListener::bind("127.0.0.1:0")?;
    let address = listener.local_addr()?;
    let server = std::thread::spawn(move || serve_once(&listener, "length"));
    let provider = LlamaCppProvider::new(&format!("http://{address}/"), profile)?;
    assert!(translate_batch(&provider, &batch()?).is_err());
    server.join().map_err(|_| "mock server panicked")??;
    Ok(())
}

#[test]
fn context_prompt_contains_neighbor_text_but_returns_only_target() -> Result<(), Box<dyn Error>> {
    let listener = TcpListener::bind("127.0.0.1:0")?;
    let address = listener.local_addr()?;
    let server = std::thread::spawn(move || serve_once(&listener, "stop"));
    let profile = ModelProfile::from_json(CONTEXT_PROFILE)?;
    let provider = LlamaCppProvider::new(&format!("http://{address}/"), profile)?;
    let batch = TranslationBatch::new(
        TranslationId::parse("11111111-1111-4111-8111-111111111111")?,
        RunId::parse("22222222-2222-4222-8222-222222222222")?,
        SourceHash::digest(b"source"),
        LanguagePair::new(LanguageCode::Chinese, LanguageCode::Russian)?,
        vec![SourceSegment::new(
            SegmentId::new(2).ok_or("invalid ID")?,
            2000,
            3000,
            vec!["你好。".into()],
        )?],
        vec![SourceSegment::new(
            SegmentId::new(1).ok_or("invalid ID")?,
            1000,
            2000,
            vec!["旁白。".into()],
        )?],
    )?;
    let translated = translate_batch(&provider, &batch)?;
    assert_eq!(translated.len(), 1);
    assert_eq!(translated[0].lines, ["Привет."]);
    let request = server.join().map_err(|_| "mock server panicked")??;
    let prompt = request["messages"][0]["content"]
        .as_str()
        .ok_or("missing context prompt")?;
    assert!(prompt.contains("context_subtitles"));
    assert!(prompt.contains("旁白。"));
    assert!(prompt.contains("你好。"));
    assert!(prompt.contains("target_line_index"));

    let mut limited: serde_json::Value = serde_json::from_slice(CONTEXT_PROFILE)?;
    limited["max_context_bytes"] = serde_json::json!(1);
    let limited_profile = ModelProfile::from_json(&serde_json::to_vec(&limited)?)?;
    let limited_provider = LlamaCppProvider::new("http://127.0.0.1:1/", limited_profile)?;
    assert!(
        translate_batch(&limited_provider, &batch).is_err_and(|error| error
            .to_string()
            .contains("context exceeds profile byte limit"))
    );
    Ok(())
}

#[test]
fn glossary_prompt_sends_only_confirmed_terms_and_enforces_budget() -> Result<(), Box<dyn Error>> {
    let listener = TcpListener::bind("127.0.0.1:0")?;
    let address = listener.local_addr()?;
    let server = std::thread::spawn(move || serve_once(&listener, "stop"));
    let profile = ModelProfile::from_json(GLOSSARY_PROFILE)?;
    let provider = LlamaCppProvider::new(&format!("http://{address}/"), profile)?;
    let term = GlossaryEntry::new("阿明".into(), "Амин".into(), vec!["Амина".into()], None)?;
    let batch = TranslationBatch::with_glossary(
        TranslationId::parse("11111111-1111-4111-8111-111111111111")?,
        RunId::parse("22222222-2222-4222-8222-222222222222")?,
        SourceHash::digest(b"source"),
        LanguagePair::new(LanguageCode::Chinese, LanguageCode::Russian)?,
        vec![SourceSegment::new(
            SegmentId::new(1).ok_or("invalid ID")?,
            1000,
            2000,
            vec!["阿明来了。".into()],
        )?],
        Vec::new(),
        vec![term],
    )?;
    let translated = translate_batch(&provider, &batch)?;
    assert_eq!(translated[0].lines, ["Привет."]);
    let request = server.join().map_err(|_| "mock server panicked")??;
    let prompt = request["messages"][0]["content"]
        .as_str()
        .ok_or("missing prompt")?;
    assert!(prompt.contains("confirmed_glossary"));
    assert!(prompt.contains("Амина"));
    assert!(prompt.contains("Амин"));
    let mut limited: serde_json::Value = serde_json::from_slice(GLOSSARY_PROFILE)?;
    limited["max_glossary_bytes"] = serde_json::json!(1);
    let limited_profile = ModelProfile::from_json(&serde_json::to_vec(&limited)?)?;
    let limited_provider = LlamaCppProvider::new("http://127.0.0.1:1/", limited_profile)?;
    assert!(
        translate_batch(&limited_provider, &batch).is_err_and(|error| error
            .to_string()
            .contains("glossary exceeds profile byte limit"))
    );
    Ok(())
}

#[test]
fn scoped_terms_reach_only_their_target_line() -> Result<(), Box<dyn Error>> {
    let listener = TcpListener::bind("127.0.0.1:0")?;
    let address = listener.local_addr()?;
    let server = std::thread::spawn(move || -> Result<_, String> {
        let first = serve_once(&listener, "stop")?;
        let second = serve_once(&listener, "stop")?;
        Ok((first, second))
    });
    let profile = ModelProfile::from_json(GLOSSARY_PROFILE)?;
    let provider = LlamaCppProvider::new(&format!("http://{address}/"), profile)?;
    let first_id = SegmentId::new(1).ok_or("invalid ID")?;
    let second_id = SegmentId::new(2).ok_or("invalid ID")?;
    let batch = TranslationBatch::with_glossary(
        TranslationId::parse("11111111-1111-4111-8111-111111111111")?,
        RunId::parse("22222222-2222-4222-8222-222222222222")?,
        SourceHash::digest(b"source"),
        LanguagePair::new(LanguageCode::Chinese, LanguageCode::Russian)?,
        vec![
            SourceSegment::new(first_id, 1000, 2000, vec!["阿明来了。".into()])?,
            SourceSegment::new(second_id, 2000, 3000, vec!["阿明来了。".into()])?,
        ],
        Vec::new(),
        vec![
            GlossaryEntry::new(
                "阿明".into(),
                "Амин".into(),
                Vec::new(),
                Some(vec![first_id]),
            )?,
            GlossaryEntry::new(
                "阿明".into(),
                "Артём".into(),
                Vec::new(),
                Some(vec![second_id]),
            )?,
        ],
    )?;
    assert_eq!(translate_batch(&provider, &batch)?.len(), 2);
    let (first, second) = server.join().map_err(|_| "mock server panicked")??;
    let first_prompt = first["messages"][0]["content"]
        .as_str()
        .ok_or("missing first prompt")?;
    let second_prompt = second["messages"][0]["content"]
        .as_str()
        .ok_or("missing second prompt")?;
    assert!(first_prompt.contains("Амин"));
    assert!(!first_prompt.contains("Артём"));
    assert!(second_prompt.contains("Артём"));
    assert!(!second_prompt.contains("Амин"));
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

fn serve_once(listener: &TcpListener, finish_reason: &str) -> Result<serde_json::Value, String> {
    serve_candidate(listener, finish_reason, None)
}

fn serve_candidate(
    listener: &TcpListener,
    finish_reason: &str,
    supplied: Option<&str>,
) -> Result<serde_json::Value, String> {
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
    let request: serde_json::Value =
        serde_json::from_slice(&raw[header_end + 4..header_end + 4 + content_length])
            .map_err(|error| error.to_string())?;
    let prompt = request["messages"][0]["content"]
        .as_str()
        .ok_or("missing prompt")?;
    let mut candidate = String::from("Привет.");
    for index in 0..20 {
        let token = format!("__AURALIS_MONEY_{index}__");
        if prompt.contains(&token) {
            candidate.push(' ');
            candidate.push_str(&token);
        }
    }
    if let Some(supplied) = supplied {
        candidate = supplied.to_owned();
    }
    let body = serde_json::json!({"choices":[{"message":{"content":candidate},"finish_reason":finish_reason}]}).to_string();
    let response = format!(
        "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}",
        body.len()
    );
    stream
        .write_all(response.as_bytes())
        .map_err(|error| error.to_string())?;
    Ok(request)
}
