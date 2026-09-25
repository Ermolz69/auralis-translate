use auralis_translation_llamacpp::{
    ReleaseAsset, download_asset_with_client, release_download_client,
};
use reqwest::blocking::Client;
use sha2::{Digest, Sha256};
use std::error::Error;
use std::io::{BufRead, BufReader, Write};
use std::net::TcpListener;
use std::sync::mpsc;
use std::time::Duration;

struct TestServer {
    url: String,
    requests: mpsc::Receiver<String>,
    worker: std::thread::JoinHandle<Result<(), String>>,
}

fn asset(url: String, bytes: &[u8]) -> ReleaseAsset {
    ReleaseAsset {
        url,
        filename: "fixture.gguf".into(),
        sha256: format!("{:x}", Sha256::digest(bytes)),
        bytes: Some(bytes.len() as u64),
    }
}

fn serve_once(response: Vec<u8>) -> Result<TestServer, Box<dyn Error>> {
    let listener = TcpListener::bind("127.0.0.1:0")?;
    let address = listener.local_addr()?;
    let (sender, receiver) = mpsc::channel();
    let handle = std::thread::spawn(move || -> Result<(), String> {
        let (mut socket, _) = listener.accept().map_err(|error| error.to_string())?;
        socket
            .set_read_timeout(Some(Duration::from_secs(5)))
            .map_err(|error| error.to_string())?;
        let mut reader = BufReader::new(socket.try_clone().map_err(|error| error.to_string())?);
        let mut request = String::new();
        loop {
            let mut line = String::new();
            let count = reader
                .read_line(&mut line)
                .map_err(|error| error.to_string())?;
            if count == 0 || line == "\r\n" {
                break;
            }
            request.push_str(&line);
        }
        sender.send(request).map_err(|error| error.to_string())?;
        socket
            .write_all(&response)
            .map_err(|error| error.to_string())?;
        Ok(())
    });
    Ok(TestServer {
        url: format!("http://{address}/fixture.gguf"),
        requests: receiver,
        worker: handle,
    })
}

fn response(status: &str, headers: &str, body: &[u8]) -> Vec<u8> {
    let mut response =
        format!("HTTP/1.1 {status}\r\n{headers}Connection: close\r\n\r\n").into_bytes();
    response.extend_from_slice(body);
    response
}

fn client() -> Result<Client, Box<dyn Error>> {
    Ok(Client::builder().timeout(Duration::from_secs(5)).build()?)
}

#[test]
fn downloads_complete_asset_and_reuses_verified_cache() -> Result<(), Box<dyn Error>> {
    let bytes = b"checked package asset";
    let reply = response(
        "200 OK",
        &format!("Content-Length: {}\r\n", bytes.len()),
        bytes,
    );
    let server = serve_once(reply)?;
    let asset = asset(server.url.clone(), bytes);
    let cache = tempfile::tempdir()?;
    let path = download_asset_with_client(&asset, cache.path(), &client()?)?;
    assert_eq!(std::fs::read(&path)?, bytes);
    assert!(
        !server
            .requests
            .recv()?
            .to_ascii_lowercase()
            .contains("range:")
    );
    server.worker.join().map_err(|_| "test server panicked")??;
    assert_eq!(
        download_asset_with_client(&asset, cache.path(), &client()?)?,
        path
    );
    Ok(())
}

#[test]
fn resumes_only_the_missing_bytes_from_a_partial_file() -> Result<(), Box<dyn Error>> {
    let bytes = b"verified-translation-runtime";
    let prefix = 9_usize;
    let reply = response(
        "206 Partial Content",
        &format!(
            "Content-Length: {}\r\nContent-Range: bytes {}-{}/{}\r\n",
            bytes.len() - prefix,
            prefix,
            bytes.len() - 1,
            bytes.len()
        ),
        &bytes[prefix..],
    );
    let server = serve_once(reply)?;
    let asset = asset(server.url.clone(), bytes);
    let cache = tempfile::tempdir()?;
    let partial = cache
        .path()
        .join(format!("{}.part.{}", asset.filename, asset.sha256));
    std::fs::write(&partial, &bytes[..prefix])?;
    let path = download_asset_with_client(&asset, cache.path(), &client()?)?;
    assert_eq!(std::fs::read(path)?, bytes);
    assert!(
        server
            .requests
            .recv()?
            .contains(&format!("range: bytes={prefix}-"))
    );
    assert!(!partial.exists());
    server.worker.join().map_err(|_| "test server panicked")??;
    Ok(())
}

#[test]
fn ignores_an_unhonored_range_and_restarts_from_zero() -> Result<(), Box<dyn Error>> {
    let bytes = b"fresh-complete-file";
    let reply = response(
        "200 OK",
        &format!("Content-Length: {}\r\n", bytes.len()),
        bytes,
    );
    let server = serve_once(reply)?;
    let asset = asset(server.url.clone(), bytes);
    let cache = tempfile::tempdir()?;
    let partial = cache
        .path()
        .join(format!("{}.part.{}", asset.filename, asset.sha256));
    std::fs::write(&partial, b"wrong-prefix")?;
    let path = download_asset_with_client(&asset, cache.path(), &client()?)?;
    assert_eq!(std::fs::read(path)?, bytes);
    assert!(server.requests.recv()?.contains("range: bytes=12-"));
    server.worker.join().map_err(|_| "test server panicked")??;
    Ok(())
}

#[test]
fn rejects_a_wrong_range_without_publishing() -> Result<(), Box<dyn Error>> {
    let bytes = b"verified asset";
    let reply = response(
        "206 Partial Content",
        &format!(
            "Content-Length: {}\r\nContent-Range: bytes 0-{}/{}\r\n",
            bytes.len(),
            bytes.len() - 1,
            bytes.len()
        ),
        bytes,
    );
    let server = serve_once(reply)?;
    let asset = asset(server.url.clone(), bytes);
    let cache = tempfile::tempdir()?;
    let partial = cache
        .path()
        .join(format!("{}.part.{}", asset.filename, asset.sha256));
    std::fs::write(&partial, b"prefix")?;
    assert!(download_asset_with_client(&asset, cache.path(), &client()?).is_err());
    assert!(!cache.path().join(&asset.filename).exists());
    assert!(server.requests.recv()?.contains("range: bytes=6-"));
    server.worker.join().map_err(|_| "test server panicked")??;
    Ok(())
}

#[test]
fn rejects_an_insecure_redirect_without_publishing() -> Result<(), Box<dyn Error>> {
    let bytes = b"verified asset";
    let server = serve_once(response(
        "302 Found",
        "Location: http://example.com/fixture.gguf\r\nContent-Length: 0\r\n",
        b"",
    ))?;
    let asset = asset(server.url.clone(), bytes);
    let cache = tempfile::tempdir()?;
    assert!(download_asset_with_client(&asset, cache.path(), &release_download_client()?).is_err());
    assert!(!cache.path().join(&asset.filename).exists());
    assert!(server.requests.recv()?.starts_with("GET /fixture.gguf"));
    server.worker.join().map_err(|_| "test server panicked")??;
    Ok(())
}
