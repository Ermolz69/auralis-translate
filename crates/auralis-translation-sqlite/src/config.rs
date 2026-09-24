use std::time::Duration;

const DEFAULT_BUSY_TIMEOUT: Duration = Duration::from_secs(5);

#[derive(Clone, Copy, Debug)]
pub struct SqliteConfig {
    busy_timeout: Duration,
}

impl SqliteConfig {
    pub fn new(busy_timeout: Duration) -> Option<Self> {
        (!busy_timeout.is_zero()).then_some(Self { busy_timeout })
    }

    pub fn busy_timeout(self) -> Duration {
        self.busy_timeout
    }
}

impl Default for SqliteConfig {
    fn default() -> Self {
        Self {
            busy_timeout: DEFAULT_BUSY_TIMEOUT,
        }
    }
}
