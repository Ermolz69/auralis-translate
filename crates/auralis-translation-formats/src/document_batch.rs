use crate::{DocumentTranslationError, SegmentTranslation};
use auralis_translation::{
    LanguagePair, RunId, SourceHash, SourceSegment, TranslationBatch, TranslationId,
    TranslationProvider, translate_batch,
};

pub(crate) fn translate(
    source: &[u8],
    segments: Vec<SourceSegment>,
    translation_id: TranslationId,
    run_id: RunId,
    language_pair: LanguagePair,
    provider: &impl TranslationProvider,
) -> Result<Vec<SegmentTranslation>, DocumentTranslationError> {
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
    Ok(accepted
        .into_iter()
        .map(|item| SegmentTranslation {
            id: item.id,
            lines: item.lines,
        })
        .collect())
}
