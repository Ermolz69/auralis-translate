use std::time::Duration;

const DEFAULT_POLL_MILLIS: u64 = 250;
const MIN_POLL_MILLIS: u64 = 10;
const MAX_POLL_MILLIS: u64 = 1000;

#[derive(Clone, Copy, Debug)]
pub struct RequestControlPolicy(Duration);

impl RequestControlPolicy {
    pub fn new(poll_interval: Duration) -> Option<Self> {
        (Duration::from_millis(MIN_POLL_MILLIS)..=Duration::from_millis(MAX_POLL_MILLIS))
            .contains(&poll_interval)
            .then_some(Self(poll_interval))
    }

    pub fn poll_interval(self) -> Duration {
        self.0
    }
}

impl Default for RequestControlPolicy {
    fn default() -> Self {
        Self(Duration::from_millis(DEFAULT_POLL_MILLIS))
    }
}
