#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum NameProposalOrigin {
    Algorithm,
    Model,
    Human,
}

impl NameProposalOrigin {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Algorithm => "algorithm",
            Self::Model => "model",
            Self::Human => "human",
        }
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct NameProposal {
    pub russian: String,
    pub origin: NameProposalOrigin,
    pub evidence_id: String,
    pub reviewer_id: Option<String>,
}
