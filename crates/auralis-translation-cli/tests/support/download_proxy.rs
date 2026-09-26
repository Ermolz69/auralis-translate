use std::{
    error::Error,
    io::{BufRead, BufReader, Write},
    net::TcpListener,
    thread::JoinHandle,
    time::{Duration, Instant},
};

pub struct DownloadProxy {
    pub url: String,
    worker: JoinHandle<Result<String, String>>,
}

impl DownloadProxy {
    pub fn rejecting() -> Result<Self, Box<dyn Error>> {
        let listener = TcpListener::bind("127.0.0.1:0")?;
        let url = format!("http://{}", listener.local_addr()?);
        listener.set_nonblocking(true)?;
        let worker = std::thread::spawn(move || {
            let deadline = Instant::now() + Duration::from_secs(5);
            let mut socket = loop {
                match listener.accept() {
                    Ok((socket, _)) => break socket,
                    Err(error) if error.kind() == std::io::ErrorKind::WouldBlock => {
                        if Instant::now() >= deadline {
                            return Err("proxy received no connection".into());
                        }
                        std::thread::sleep(Duration::from_millis(10));
                    }
                    Err(error) => return Err(error.to_string()),
                }
            };
            socket
                .set_read_timeout(Some(Duration::from_secs(2)))
                .map_err(|error| error.to_string())?;
            let mut reader = BufReader::new(socket.try_clone().map_err(|error| error.to_string())?);
            let mut request = String::new();
            loop {
                let mut line = String::new();
                if reader
                    .read_line(&mut line)
                    .map_err(|error| error.to_string())?
                    == 0
                    || line == "\r\n"
                {
                    break;
                }
                request.push_str(&line);
            }
            socket.write_all(b"HTTP/1.1 503 Service Unavailable\r\nContent-Length: 0\r\nConnection: close\r\n\r\n").map_err(|error| error.to_string())?;
            Ok(request)
        });
        Ok(Self { url, worker })
    }

    pub fn finish(self) -> Result<String, Box<dyn Error>> {
        Ok(self
            .worker
            .join()
            .map_err(|_| "download proxy panicked")??)
    }
}
