use super::TargetSegment;

pub const PROVIDER_RESPONSE_SCHEMA_VERSION: u32 = 1;

#[derive(Clone, Debug)]
pub struct ProviderResponse {
    pub schema_version: u32,
    pub translations: Vec<TargetSegment>,
}
