use std::cell::Cell;
use std::fs::File;
use std::io::Read;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::Instant;

static NEXT_OPERATION: AtomicU64 = AtomicU64::new(1);
thread_local! { static OPERATION: Cell<u64> = const { Cell::new(0) }; }

pub(crate) fn enabled() -> bool {
    std::env::var_os("AURALIS_EVAL_JOURNAL_PHASES").is_some_and(|value| value == "1")
}

pub(crate) fn with_operation<T>(f: impl FnOnce() -> T) -> T {
    if !enabled() {
        return f();
    }
    let id = NEXT_OPERATION.fetch_add(1, Ordering::Relaxed);
    OPERATION.with(|slot| {
        let previous = slot.replace(id);
        let result = f();
        slot.set(previous);
        result
    })
}

pub(crate) struct PhaseTimer {
    name: &'static str,
    start: Instant,
}

impl PhaseTimer {
    pub(crate) fn new(name: &'static str) -> Self {
        Self {
            name,
            start: Instant::now(),
        }
    }
}

impl Drop for PhaseTimer {
    fn drop(&mut self) {
        OPERATION.with(|slot| {
            let id = slot.get();
            if id != 0 {
                eprintln!(
                    "auralis_eval_journal {{\"schema_version\":1,\"operation\":{id},\"phase\":\"{}\",\"elapsed_us\":{}}}",
                    self.name,
                    self.start.elapsed().as_micros()
                );
            }
        });
    }
}

pub(crate) fn wal_snapshot(path: &Path, phase: &'static str) {
    OPERATION.with(|slot| {
        let id = slot.get();
        if id == 0 {
            return;
        }
        let mut name = path.as_os_str().to_os_string();
        name.push("-wal");
        let wal = PathBuf::from(name);
        let bytes = std::fs::metadata(&wal).map(|meta| meta.len()).unwrap_or(0);
        let mut salt = [0_u8; 8];
        let has_salt = File::open(&wal)
            .and_then(|mut file| {
                let mut header = [0_u8; 24];
                file.read_exact(&mut header)?;
                salt.copy_from_slice(&header[16..24]);
                Ok(())
            })
            .is_ok();
        let salt = if has_salt { u64::from_be_bytes(salt) } else { 0 };
        eprintln!(
            "auralis_eval_journal {{\"schema_version\":1,\"operation\":{id},\"phase\":\"{phase}\",\"wal_bytes\":{bytes},\"wal_salt\":{salt}}}"
        );
    });
}
