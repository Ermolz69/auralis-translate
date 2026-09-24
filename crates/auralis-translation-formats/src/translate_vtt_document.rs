use crate::vtt::VttDocument;
use crate::{DocumentTranslationError, document_batch};
use auralis_translation::{LanguagePair, RunId, TranslationId, TranslationProvider};

pub fn translate_vtt_document(
    source: &[u8],
    translation_id: TranslationId,
    run_id: RunId,
    language_pair: LanguagePair,
    provider: &impl TranslationProvider,
) -> Result<Vec<u8>, DocumentTranslationError> {
    let document = VttDocument::parse(source).map_err(DocumentTranslationError::InspectVtt)?;
    let segments = document
        .source_segments()
        .map_err(DocumentTranslationError::Contract)?;
    let replacements = document_batch::translate(
        source,
        segments,
        translation_id,
        run_id,
        language_pair,
        provider,
    )?;
    document
        .render(&replacements)
        .map_err(DocumentTranslationError::RenderVtt)
}
