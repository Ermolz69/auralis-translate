#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum InferenceRequestKind {
    ChatCompletion,
    ApplyTemplate,
    Tokenize,
    CountInputTokens,
}

impl InferenceRequestKind {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::ChatCompletion => "chat_completion",
            Self::ApplyTemplate => "apply_template",
            Self::Tokenize => "tokenize",
            Self::CountInputTokens => "count_input_tokens",
        }
    }

    pub fn parse(value: &str) -> Option<Self> {
        match value {
            "chat_completion" => Some(Self::ChatCompletion),
            "apply_template" => Some(Self::ApplyTemplate),
            "tokenize" => Some(Self::Tokenize),
            "count_input_tokens" => Some(Self::CountInputTokens),
            _ => None,
        }
    }
}
