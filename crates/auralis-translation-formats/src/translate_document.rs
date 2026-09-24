use crate::srt::SegmentTranslation;
use crate::{DocumentTranslationError, inspect};
use auralis_translation::{
    LanguagePair, RunId, SourceHash, TranslationBatch, TranslationId, TranslationProvider,
    translate_batch,
};

pub fn translate_document(
    source: &[u8],
    translation_id: TranslationId,
    run_id: RunId,
    language_pair: LanguagePair,
    provider: &impl TranslationProvider,
) -> Result<Vec<u8>, DocumentTranslationError> {
    let document = inspect(source).map_err(DocumentTranslationError::Inspect)?;
    let segments = document
        .source_segments()
        .map_err(DocumentTranslationError::Contract)?;
    let batch = TranslationBatch::new(
        translation_id,
        run_id,
        SourceHash::digest(source),
        language_pair,
        segments,
        Vec::new(),
    )
    .map_err(DocumentTranslationError::Contract)?;
    let accepted = translate_batch(provider, &batch).map_err(DocumentTranslationError::Provider)?;
    let replacements: Vec<_> = accepted
        .into_iter()
        .map(|item| SegmentTranslation {
            id: item.id,
            lines: item.lines,
        })
        .collect();
    document
        .render(&replacements)
        .map_err(DocumentTranslationError::Render)
}
