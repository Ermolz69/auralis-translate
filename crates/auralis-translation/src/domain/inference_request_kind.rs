#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum InferenceRequestKind {
    ChatCompletion,
    ApplyTemplate,
    Tokenize,
}

impl InferenceRequestKind {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::ChatCompletion => "chat_completion",
            Self::ApplyTemplate => "apply_template",
            Self::Tokenize => "tokenize",
        }
    }

    pub fn parse(value: &str) -> Option<Self> {
        match value {
            "chat_completion" => Some(Self::ChatCompletion),
            "apply_template" => Some(Self::ApplyTemplate),
            "tokenize" => Some(Self::Tokenize),
            _ => None,
        }
    }
}
