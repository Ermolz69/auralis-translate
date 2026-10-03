use serde_json::{Value, json};
use std::{
    io::{Read, Write},
    net::TcpListener,
    time::{Duration, Instant},
};

pub fn serve(listener: TcpListener, model: String, fail_second: bool) -> Result<Vec<u32>, String> {
    listener.set_nonblocking(true).map_err(|e| e.to_string())?;
    let deadline = Instant::now() + Duration::from_secs(30);
    let mut targets = Vec::new();
    let requests = if fail_second { 9 } else { 6 };
    for _ in 0..requests {
        let (mut stream, _) = loop {
            match listener.accept() {
                Ok(value) => break value,
                Err(e)
                    if e.kind() == std::io::ErrorKind::WouldBlock && Instant::now() < deadline =>
                {
                    std::thread::sleep(Duration::from_millis(5))
                }
                Err(e) => return Err(e.to_string()),
            }
        };
        stream.set_nonblocking(false).map_err(|e| e.to_string())?;
        stream
            .set_read_timeout(Some(Duration::from_secs(5)))
            .map_err(|e| e.to_string())?;
        let mut raw = Vec::new();
        let mut buffer = [0; 4096];
        let (header_end, length) = loop {
            let count = stream.read(&mut buffer).map_err(|e| e.to_string())?;
            if count == 0 {
                return Err("request ended early".into());
            }
            raw.extend_from_slice(&buffer[..count]);
            if let Some(end) = raw.windows(4).position(|w| w == b"\r\n\r\n") {
                let head = String::from_utf8_lossy(&raw[..end]);
                let length = head
                    .lines()
                    .find_map(|line| {
                        line.to_ascii_lowercase()
                            .strip_prefix("content-length: ")
                            .and_then(|text| text.parse::<usize>().ok())
                    })
                    .unwrap_or(0);
                break (end + 4, length);
            }
        };
        while raw.len() < header_end + length {
            let count = stream.read(&mut buffer).map_err(|e| e.to_string())?;
            if count == 0 {
                return Err("request body ended early".into());
            }
            raw.extend_from_slice(&buffer[..count]);
        }
        let route = String::from_utf8_lossy(&raw[..header_end])
            .split_whitespace()
            .nth(1)
            .ok_or("route")?
            .to_owned();
        let body=match route.as_str() {
            "/health"=>json!({"status":"ok"}),
            "/props"=>json!({"model_path":model,"model_alias":"auralis-hy-mt2-7b-q4","build_info":"b10977-0ecb159c9","default_generation_settings":{"n_ctx":2048}}),
            "/v1/models"=>json!({"data":[{"id":"auralis-hy-mt2-7b-q4"}]}),
            "/apply-template"=>json!({"prompt":"mock-rendered-prompt"}),
            "/tokenize"=>json!({"tokens":[1,2,3,4,5,6,7,8,9,10]}),
            "/v1/chat/completions"=>{
                let request:Value=serde_json::from_slice(&raw[header_end..header_end+length]).map_err(|e|e.to_string())?;
                let prompt=request["messages"][0]["content"].as_str().ok_or("prompt")?;
                let envelope:Value=serde_json::from_str(prompt.split_once("Input JSON:\n").ok_or("input")?.1).map_err(|e|e.to_string())?;
                let slot=&envelope["target_slots"][0];
                let id=slot["segment_id"].as_u64().ok_or("id")? as u32;
                targets.push(id);
                if slot["name_proposals"][0]["source"]!="小王" {return Err("missing scoped name".into());}
                let content=if fail_second && id==2 {"not valid JSON".into()}
                    else {json!({"translations":[{"segment_id":id,"line_index":0,"text":if id==1 {"Сяо Ван, входите."} else {"Сяо Ван, садитесь."}}]}).to_string()};
                json!({"choices":[{"message":{"content":content},"finish_reason":"stop"}],"usage":{"prompt_tokens":10,"completion_tokens":10}})
            },
            _=>return Err(format!("unexpected route {route}")),
        }.to_string();
        write!(stream,"HTTP/1.1 200 OK\r\nContent-Length: {}\r\nContent-Type: application/json\r\nConnection: close\r\n\r\n{body}",body.len()).map_err(|e|e.to_string())?;
    }
    Ok(targets)
}
