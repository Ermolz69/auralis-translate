use super::{LlamaCppProvider, RESPONSE_SCHEMA_VERSION};
use crate::prompt;
use auralis_translation::{
    DiagnosticCode, LanguageCode, ProviderError, ProviderResponse, RunControl, RunId,
    TargetSegment, TranslationBatch, TranslationDiagnostic,
};

impl LlamaCppProvider {
    pub(super) fn translate_controlled(
        &self,
        batch: &TranslationBatch,
        control: Option<(&dyn RunControl, RunId)>,
    ) -> Result<(ProviderResponse, Vec<TranslationDiagnostic>), ProviderError> {
        if matches!(self.profile.prompt_version, 4..=8)
            && batch.language_pair().source() != LanguageCode::Chinese
        {
            return Err(ProviderError::Permanent(
                "Chinese fidelity profile requires Chinese source".into(),
            ));
        }
        if matches!(self.profile.prompt_version, 1 | 4) && !batch.context().is_empty() {
            return Err(ProviderError::Permanent(
                "experimental profile has no context support".into(),
            ));
        }
        if self.profile.prompt_version != 3 && !batch.glossary().is_empty() {
            return Err(ProviderError::Permanent(
                "profile does not support glossary entries".into(),
            ));
        }
        if batch.glossary().len() > self.profile.max_glossary_entries {
            return Err(ProviderError::Permanent(
                "glossary exceeds profile entry limit".into(),
            ));
        }
        let glossary_bytes = prompt::glossary_payload_bytes(batch.glossary())
            .map_err(|error| ProviderError::Permanent(error.to_string()))?;
        if glossary_bytes > self.profile.max_glossary_bytes {
            return Err(ProviderError::Permanent(
                "glossary exceeds profile byte limit".into(),
            ));
        }
        if !matches!(self.profile.prompt_version, 5..=8) && !batch.approved_terms().is_empty() {
            return Err(ProviderError::Permanent(
                "profile does not support approved terms".into(),
            ));
        }
        if batch.approved_terms().len() > self.profile.max_approved_terms_entries {
            return Err(ProviderError::Permanent(
                "approved terms exceed profile entry limit".into(),
            ));
        }
        let terms_bytes = if batch.approved_terms().is_empty() {
            0
        } else {
            crate::contextual_prompt_v5::approved_terms_bytes(batch.approved_terms())?
        };
        if terms_bytes > self.profile.max_approved_terms_bytes {
            return Err(ProviderError::Permanent(
                "approved terms exceed profile byte limit".into(),
            ));
        }
        let context_bytes: usize = batch
            .context()
            .iter()
            .flat_map(|segment| segment.lines())
            .map(String::len)
            .sum();
        if context_bytes > self.profile.max_context_bytes {
            return Err(ProviderError::Permanent(
                "context exceeds profile byte limit".into(),
            ));
        }
        if matches!(self.profile.prompt_version, 7 | 8) {
            return self.translate_v7_batch(batch, control);
        }
        let mut translations = Vec::with_capacity(batch.targets().len());
        let mut diagnostics = Vec::new();
        for segment in batch.targets() {
            let segment_glossary = batch
                .glossary()
                .iter()
                .filter(|entry| {
                    entry
                        .segment_ids()
                        .is_none_or(|scope| scope.contains(&segment.id()))
                })
                .cloned()
                .collect::<Vec<_>>();
            let mut lines = Vec::with_capacity(segment.lines().len());
            for (line_index, source_line) in segment.lines().iter().enumerate() {
                if self.profile.prompt_version == 4 {
                    let prepared = crate::chinese_fidelity_prompt::ChineseFidelityPrompt::prepare(
                        source_line,
                    )?;
                    let candidate =
                        self.translate_line(prepared.text.clone(), source_line, control, None)?;
                    lines.push(prepared.restore(&candidate)?);
                    continue;
                }
                if matches!(self.profile.prompt_version, 5 | 6) {
                    let prepared = crate::chinese_fidelity_prompt::ChineseFidelityPrompt::prepare(
                        source_line,
                    )?;
                    let prompt_text = if self.profile.token_safety_margin_tokens.is_some() {
                        self.budgeted_v5_prompt(batch, segment, line_index, &prepared, control)?
                    } else {
                        crate::contextual_prompt_v5::render(
                            segment,
                            line_index,
                            batch.context(),
                            &prepared,
                            batch.approved_terms(),
                        )
                    };
                    let (line, inserted_prefix) = self.translate_v5_line(
                        batch,
                        segment,
                        line_index,
                        source_line,
                        prompt_text,
                        &prepared,
                        control,
                    )?;
                    if inserted_prefix {
                        diagnostics.push(TranslationDiagnostic {
                            code: DiagnosticCode::SourcePrefixInserted,
                            segment_id: segment.id(),
                            line_index: u32::try_from(line_index).map_err(|_| {
                                ProviderError::Permanent(
                                    "line index exceeds diagnostic range".into(),
                                )
                            })?,
                        });
                    }
                    lines.push(line);
                    continue;
                }
                let prompt_text = match self.profile.prompt_version {
                    1 => prompt::translate_line(source_line),
                    2 => prompt::translate_line_with_context(segment, line_index, batch.context()),
                    3 => prompt::translate_line_with_glossary(
                        segment,
                        line_index,
                        batch.context(),
                        &segment_glossary,
                    ),
                    _ => {
                        return Err(ProviderError::Permanent(
                            "unsupported prompt version".into(),
                        ));
                    }
                };
                lines.push(self.translate_line(prompt_text, source_line, control, None)?);
            }
            translations.push(TargetSegment {
                id: segment.id(),
                lines,
            });
        }
        Ok((
            ProviderResponse {
                schema_version: RESPONSE_SCHEMA_VERSION,
                translations,
            },
            diagnostics,
        ))
    }
}
