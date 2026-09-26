use auralis_translation::{
    LanguageCode, LanguagePair, ProviderError, RunControl, RunId, SegmentId, SourceHash,
    SourceSegment, TranslationBatch, TranslationId, TranslationProvider,
};
use auralis_translation_llamacpp::{LlamaCppProvider, ModelProfile, RequestControlPolicy};
use std::error::Error;
use std::io::{Read, Write};
use std::net::{TcpListener, TcpStream};
use std::sync::{
    Arc,
    atomic::{AtomicU8, Ordering},
    mpsc,
};
use std::time::{Duration, Instant};

const PROFILE: &[u8] =
    include_bytes!("../../../models/manifests/hy_mt2_1_8b_q4_k_m.experimental.json");

struct Control(Arc<AtomicU8>);

impl RunControl for Control {
    fn pause_requested(&self, _: RunId) -> Result<bool, Box<dyn Error>> {
        match self.0.load(Ordering::SeqCst) {
            0 => Ok(false),
            1 => Ok(true),
            _ => Err("injected control read failure".into()),
        }
    }
}

#[test]
fn cancels_while_waiting_for_headers_or_an_incomplete_body() -> Result<(), Box<dyn Error>> {
    for partial_body in [false, true] {
        interrupted_request(partial_body, 1)?;
    }
    Ok(())
}

#[test]
fn control_failure_disconnects_without_waiting_for_model_timeout() -> Result<(), Box<dyn Error>> {
    interrupted_request(true, 2)
}

#[test]
fn readiness_probe_disconnects_on_preparation_cancellation() -> Result<(), Box<dyn Error>> {
    for partial_body in [false, true] {
        let listener = TcpListener::bind("127.0.0.1:0")?;
        let endpoint = format!("http://{}/", listener.local_addr()?);
        let (ready_tx, ready_rx) = mpsc::channel();
        let server = std::thread::spawn(move || -> Result<(), String> {
            let mut stream = accept_request(&listener)?;
            if partial_body {
                stream
                    .write_all(
                        b"HTTP/1.1 200 OK\r\nContent-Length: 4096\r\nConnection: close\r\n\r\n{",
                    )
                    .map_err(|cause| cause.to_string())?;
            }
            ready_tx.send(()).map_err(|cause| cause.to_string())?;
            let mut byte = [0];
            match stream.read(&mut byte) {
                Ok(0) => Ok(()),
                Err(cause) if cause.kind() == std::io::ErrorKind::ConnectionReset => Ok(()),
                other => Err(format!("preflight stayed connected: {other:?}")),
            }
        });
        let flag = Arc::new(AtomicU8::new(0));
        let worker_flag = flag.clone();
        let (finished_tx, finished_rx) = mpsc::channel();
        let worker = std::thread::spawn(move || -> Result<(), String> {
            let profile = ModelProfile::from_json(PROFILE).map_err(|cause| cause.to_string())?;
            let provider =
                LlamaCppProvider::new(&endpoint, profile).map_err(|cause| cause.to_string())?;
            let control = || {
                if worker_flag.load(Ordering::SeqCst) == 0 {
                    Ok(())
                } else {
                    Err(ProviderError("preparation cancelled".into()))
                }
            };
            finished_tx
                .send(
                    provider
                        .probe_server_with_control(&control)
                        .map_err(|cause| cause.to_string()),
                )
                .map_err(|cause| cause.to_string())?;
            Ok(())
        });
        ready_rx.recv_timeout(Duration::from_secs(5))?;
        flag.store(1, Ordering::SeqCst);
        let result = finished_rx.recv_timeout(Duration::from_secs(3))?;
        assert!(matches!(result, Err(message) if message == "preparation cancelled"));
        worker.join().map_err(|_| "probe worker panicked")??;
        server.join().map_err(|_| "probe server panicked")??;
    }
    Ok(())
}

#[test]
fn validates_control_poll_bounds() {
    assert!(RequestControlPolicy::new(Duration::ZERO).is_none());
    assert!(RequestControlPolicy::new(Duration::from_millis(9)).is_none());
    assert!(RequestControlPolicy::new(Duration::from_millis(10)).is_some());
    assert!(RequestControlPolicy::new(Duration::from_millis(1000)).is_some());
    assert!(RequestControlPolicy::new(Duration::from_millis(1001)).is_none());
}

#[test]
fn releases_idle_connections_between_synchronous_calls() -> Result<(), Box<dyn Error>> {
    let listener = TcpListener::bind("127.0.0.1:0")?;
    let endpoint = format!("http://{}/", listener.local_addr()?);
    let server = std::thread::spawn(move || -> Result<(), String> {
        for _ in 0..2 {
            let mut stream = accept_request(&listener)?;
            let body = r#"{"choices":[{"message":{"content":"Привет."},"finish_reason":"stop"}]}"#;
            write!(
                stream,
                "HTTP/1.1 200 OK\r\nContent-Length: {}\r\nConnection: keep-alive\r\n\r\n{body}",
                body.len()
            )
            .map_err(|cause| cause.to_string())?;
            let mut byte = [0];
            match stream.read(&mut byte) {
                Ok(0) => {}
                Err(cause) if cause.kind() == std::io::ErrorKind::ConnectionReset => {}
                other => {
                    return Err(format!(
                        "unpolled connection was retained or reused: {other:?}"
                    ));
                }
            }
        }
        Ok(())
    });
    let provider = LlamaCppProvider::new(&endpoint, ModelProfile::from_json(PROFILE)?)?;
    let batch = batch()?;
    assert_eq!(
        provider.translate(&batch)?.translations[0].lines,
        ["Привет."]
    );
    assert_eq!(
        provider.translate(&batch)?.translations[0].lines,
        ["Привет."]
    );
    server.join().map_err(|_| "server panicked")??;
    Ok(())
}

fn interrupted_request(partial_body: bool, state: u8) -> Result<(), Box<dyn Error>> {
    let listener = TcpListener::bind("127.0.0.1:0")?;
    let endpoint = format!("http://{}/", listener.local_addr()?);
    let (ready_tx, ready_rx) = mpsc::channel();
    let server = std::thread::spawn(move || -> Result<(), String> {
        let mut stream = accept_request(&listener)?;
        if partial_body {
            stream.write_all(b"HTTP/1.1 200 OK\r\nContent-Length: 4096\r\nConnection: close\r\n\r\n{\"choices\":[")
                .map_err(|cause| cause.to_string())?;
        }
        ready_tx.send(()).map_err(|cause| cause.to_string())?;
        let mut byte = [0];
        match stream.read(&mut byte) {
            Ok(0) => {}
            Err(cause) if cause.kind() == std::io::ErrorKind::ConnectionReset => {}
            other => return Err(format!("request stayed connected: {other:?}")),
        }
        // Reuse the same provider after cancellation; no abandoned retry reaches this socket.
        let mut stream = accept_request(&listener)?;
        let body = r#"{"choices":[{"message":{"content":"Привет."},"finish_reason":"stop"}]}"#;
        write!(
            stream,
            "HTTP/1.1 200 OK\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}",
            body.len()
        )
        .map_err(|cause| cause.to_string())?;
        Ok(())
    });
    let state_flag = Arc::new(AtomicU8::new(0));
    let control = Control(state_flag.clone());
    let mut profile: serde_json::Value = serde_json::from_slice(PROFILE)?;
    profile["timeout_seconds"] = serde_json::json!(10);
    let profile = ModelProfile::from_json(&serde_json::to_vec(&profile)?)?;
    let batch = batch()?;
    let (finished_tx, finished_rx) = mpsc::channel();
    let worker = std::thread::spawn(move || -> Result<(), String> {
        let provider =
            LlamaCppProvider::new(&endpoint, profile).map_err(|cause| cause.to_string())?;
        let result = provider.translate_with_control(&batch, &control);
        finished_tx
            .send(result.map(|_| ()).map_err(|cause| cause.to_string()))
            .map_err(|cause| cause.to_string())?;
        control.0.store(0, Ordering::SeqCst);
        let result = provider
            .translate_with_control(&batch, &control)
            .map_err(|cause| cause.to_string())?;
        if result.translations[0].lines != ["Привет."] {
            return Err("provider could not resume".into());
        }
        Ok(())
    });
    ready_rx.recv_timeout(Duration::from_secs(5))?;
    state_flag.store(state, Ordering::SeqCst);
    let result = finished_rx.recv_timeout(Duration::from_secs(3))?;
    let reason = result.err().ok_or("unfinished response was accepted")?;
    assert!(
        reason.contains(if state == 1 {
            "request paused"
        } else {
            "control read failure"
        }),
        "unexpected provider error: {reason}"
    );
    worker.join().map_err(|_| "provider worker panicked")??;
    server.join().map_err(|_| "server panicked")??;
    Ok(())
}

fn accept_request(listener: &TcpListener) -> Result<TcpStream, String> {
    listener
        .set_nonblocking(true)
        .map_err(|cause| cause.to_string())?;
    let started = Instant::now();
    let mut stream = loop {
        match listener.accept() {
            Ok((stream, _)) => break stream,
            Err(cause) if cause.kind() == std::io::ErrorKind::WouldBlock => {
                if started.elapsed() > Duration::from_secs(5) {
                    return Err("request timeout".into());
                }
                std::thread::sleep(Duration::from_millis(10));
            }
            Err(cause) => return Err(cause.to_string()),
        }
    };
    stream
        .set_nonblocking(false)
        .map_err(|cause| cause.to_string())?;
    stream
        .set_read_timeout(Some(Duration::from_secs(5)))
        .map_err(|cause| cause.to_string())?;
    let mut raw = Vec::new();
    let mut bytes = [0; 4096];
    loop {
        let count = stream.read(&mut bytes).map_err(|cause| cause.to_string())?;
        if count == 0 {
            return Err("request ended early".into());
        }
        raw.extend_from_slice(&bytes[..count]);
        if let Some(end) = raw.windows(4).position(|window| window == b"\r\n\r\n") {
            let headers = std::str::from_utf8(&raw[..end]).map_err(|cause| cause.to_string())?;
            let length = headers
                .lines()
                .find_map(|line| {
                    line.to_ascii_lowercase()
                        .strip_prefix("content-length: ")
                        .and_then(|value| value.parse::<usize>().ok())
                })
                .or_else(|| headers.starts_with("GET ").then_some(0))
                .ok_or("missing request length")?;
            if raw.len() >= end + 4 + length {
                return Ok(stream);
            }
        }
    }
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
