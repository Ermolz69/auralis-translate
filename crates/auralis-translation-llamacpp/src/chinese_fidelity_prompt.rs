use auralis_translation::ProviderError;

pub(crate) struct ChineseFidelityPrompt {
    pub text: String,
    pub source_for_translation: String,
    pub protected_facts: Vec<ProtectedMoneyFact>,
    replacements: Vec<(String, String)>,
}

pub(crate) struct ProtectedMoneyFact {
    pub token: String,
    pub original_span: String,
    pub normalized_ru: String,
}

impl ChineseFidelityPrompt {
    pub fn prepare(source: &str) -> Result<Self, ProviderError> {
        if source.contains("__AURALIS_MONEY_") {
            return Err(ProviderError(
                "source collides with protected money tokens".into(),
            ));
        }
        let terms = crate::chinese_money_terms::extract(source);
        let chars: Vec<_> = source.chars().collect();
        let mut masked = String::new();
        let mut replacements = Vec::new();
        let mut protected_facts = Vec::new();
        let mut cursor = 0;
        for (index, term) in terms.iter().enumerate() {
            let token = format!("__AURALIS_MONEY_{index}__");
            masked.extend(chars[cursor..term.start].iter());
            masked.push_str(&token);
            cursor = term.end;
            protected_facts.push(ProtectedMoneyFact {
                token: token.clone(),
                original_span: chars[term.start..term.end].iter().collect(),
                normalized_ru: term.target.clone(),
            });
            replacements.push((token, term.target.clone()));
        }
        masked.extend(chars[cursor..].iter());
        let text = if replacements.is_empty() {
            crate::prompt::translate_line(source)
        } else {
            format!(
                "Translate the following text into Russian. Copy every __AURALIS_MONEY_N__ token exactly, without translating, removing or duplicating it. Each token represents a protected monetary amount. Only output the translated result without explanation:\n{masked}"
            )
        };
        Ok(Self {
            text,
            source_for_translation: masked,
            protected_facts,
            replacements,
        })
    }

    pub fn restore(&self, candidate: &str) -> Result<String, ProviderError> {
        let mut restored = candidate.to_owned();
        let mut last_position = None;
        for (token, target) in &self.replacements {
            if self.text.matches(token).count() != candidate.matches(token).count() {
                return Err(ProviderError(
                    "model changed a protected monetary token".into(),
                ));
            }
            let position = candidate
                .find(token)
                .ok_or_else(|| ProviderError("model omitted a protected monetary token".into()))?;
            if last_position.is_some_and(|last| position < last) {
                return Err(ProviderError(
                    "model reordered protected monetary tokens".into(),
                ));
            }
            last_position = Some(position);
            let position = restored
                .find(token)
                .ok_or_else(|| ProviderError("protected token restoration failed".into()))?;
            let end = position + token.len();
            let before = restored[..position]
                .chars()
                .next_back()
                .is_some_and(char::is_alphanumeric);
            let after = restored[end..]
                .chars()
                .next()
                .is_some_and(char::is_alphanumeric);
            let spaced = format!(
                "{}{target}{}",
                if before { " " } else { "" },
                if after { " " } else { "" }
            );
            restored.replace_range(position..end, &spaced);
        }
        if restored.contains("__AURALIS_MONEY_") {
            return Err(ProviderError(
                "model invented a protected monetary token".into(),
            ));
        }
        Ok(restored)
    }
}
