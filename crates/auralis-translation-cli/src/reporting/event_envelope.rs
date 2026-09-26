use super::CliEvent;
use serde::Serialize;

pub(crate) const PROTOCOL_VERSION: u32 = 1;

#[derive(Serialize)]
pub(super) struct EventEnvelope<'a> {
    pub schema_version: u32,
    pub sequence: u64,
    #[serde(flatten)]
    pub event: &'a CliEvent,
}
