#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum InferenceRequestOutcome {
    ValidatedLine,
    ParsedPreflightJson,
    MalformedCandidate,
    InvalidCandidate,
    TransportFailure,
    Timeout,
    ResourceFailure,
    Paused,
    OtherPermanent,
}

impl InferenceRequestOutcome {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::ValidatedLine => "validated_line",
            Self::ParsedPreflightJson => "parsed_preflight_json",
            Self::MalformedCandidate => "malformed_candidate",
            Self::InvalidCandidate => "invalid_candidate",
            Self::TransportFailure => "transport_failure",
            Self::Timeout => "timeout",
            Self::ResourceFailure => "resource_failure",
            Self::Paused => "paused",
            Self::OtherPermanent => "other_permanent",
        }
    }

    pub fn parse(value: &str) -> Option<Self> {
        match value {
            "validated_line" => Some(Self::ValidatedLine),
            "parsed_preflight_json" => Some(Self::ParsedPreflightJson),
            "malformed_candidate" => Some(Self::MalformedCandidate),
            "invalid_candidate" => Some(Self::InvalidCandidate),
            "transport_failure" => Some(Self::TransportFailure),
            "timeout" => Some(Self::Timeout),
            "resource_failure" => Some(Self::ResourceFailure),
            "paused" => Some(Self::Paused),
            "other_permanent" => Some(Self::OtherPermanent),
            _ => None,
        }
    }
}
