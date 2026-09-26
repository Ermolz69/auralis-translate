use std::{
    io::{Read, Write},
    net::{TcpListener, TcpStream},
    sync::mpsc::Sender,
    time::{Duration, Instant},
};

pub fn serve(listener: TcpListener, count: usize, pause: Option<Sender<()>>) -> Result<(), String> {
    listener
        .set_nonblocking(true)
        .map_err(|error| error.to_string())?;
    let deadline = Instant::now() + Duration::from_secs(10);
    for request in 1..=count {
        let mut stream = loop {
            match listener.accept() {
                Ok((stream, _)) => break stream,
                Err(error)
                    if error.kind() == std::io::ErrorKind::WouldBlock
                        && Instant::now() < deadline =>
                {
                    std::thread::sleep(Duration::from_millis(10))
                }
                Err(error) => return Err(error.to_string()),
            }
        };
        stream
            .set_nonblocking(false)
            .map_err(|error| error.to_string())?;
        stream
            .set_read_timeout(Some(Duration::from_secs(5)))
            .map_err(|error| error.to_string())?;
        read_request(&mut stream)?;
        if request == count
            && let Some(ready) = &pause
        {
            ready.send(()).map_err(|_| "pause waiter closed")?;
            let mut buffer = [0];
            return match stream.read(&mut buffer) {
                Ok(0) => Ok(()),
                Err(error) if error.kind() == std::io::ErrorKind::ConnectionReset => Ok(()),
                other => Err(format!("request did not disconnect on pause: {other:?}")),
            };
        }
        let body = r#"{"choices":[{"message":{"content":"Привет."},"finish_reason":"stop"}]}"#;
        write!(stream, "HTTP/1.1 200 OK\r\nContent-Length: {}\r\nContent-Type: application/json\r\nConnection: close\r\n\r\n{body}", body.len()).map_err(|error| error.to_string())?;
    }
    Ok(())
}

fn read_request(stream: &mut TcpStream) -> Result<(), String> {
    let mut raw = Vec::new();
    let mut buffer = [0; 4096];
    loop {
        let count = stream
            .read(&mut buffer)
            .map_err(|error| error.to_string())?;
        if count == 0 {
            return Err("request ended early".into());
        }
        raw.extend_from_slice(&buffer[..count]);
        if let Some(end) = raw.windows(4).position(|bytes| bytes == b"\r\n\r\n") {
            let header = std::str::from_utf8(&raw[..end]).map_err(|error| error.to_string())?;
            let length = header
                .lines()
                .find_map(|line| {
                    line.to_ascii_lowercase()
                        .strip_prefix("content-length: ")
                        .and_then(|value| value.parse::<usize>().ok())
                })
                .ok_or("request length missing")?;
            if raw.len() >= end + 4 + length {
                return Ok(());
            }
        }
        if raw.len() > 1024 * 1024 {
            return Err("oversized mock request".into());
        }
    }
}
