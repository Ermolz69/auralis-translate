use std::{
    io::{self, Write},
    sync::{Arc, Mutex},
};

#[derive(Clone, Default)]
pub struct CapturedWriter(pub Arc<Mutex<Vec<u8>>>);

impl Write for CapturedWriter {
    fn write(&mut self, bytes: &[u8]) -> io::Result<usize> {
        self.0
            .lock()
            .map_err(|_| io::Error::other("test capture lock poisoned"))?
            .extend_from_slice(bytes);
        Ok(bytes.len())
    }
    fn flush(&mut self) -> io::Result<()> {
        Ok(())
    }
}

impl CapturedWriter {
    pub fn records(&self) -> Result<Vec<serde_json::Value>, Box<dyn std::error::Error>> {
        let bytes = self
            .0
            .lock()
            .map_err(|_| "test capture lock poisoned")?
            .clone();
        Ok(std::str::from_utf8(&bytes)?
            .lines()
            .map(serde_json::from_str)
            .collect::<Result<_, _>>()?)
    }
}
