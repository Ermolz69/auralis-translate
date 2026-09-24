use auralis_translation::{
    LanguageCode, LanguagePair, ProviderError, ProviderResponse, RunId, SegmentId, SourceHash,
    SourceSegment, TargetSegment, TranslationBatch, TranslationId, TranslationProvider,
};
use std::error::Error;

pub fn sample_batch() -> Result<TranslationBatch, Box<dyn Error>> {
    let targets = vec![segment(1, "你好。")?, segment(2, "再见。")?];
    let context = vec![segment(3, "旁白。")?];
    Ok(TranslationBatch::new(
        TranslationId::parse("11111111-1111-4111-8111-111111111111")?,
        RunId::parse("22222222-2222-4222-8222-222222222222")?,
        SourceHash::digest(b"fixture"),
        LanguagePair::new(LanguageCode::Chinese, LanguageCode::Russian)?,
        targets,
        context,
    )?)
}

pub fn segment(id: u32, text: &str) -> Result<SourceSegment, Box<dyn Error>> {
    Ok(SourceSegment::new(
        SegmentId::new(id).ok_or("segment ID must be nonzero")?,
        u64::from(id) * 1000,
        u64::from(id + 1) * 1000,
        vec![text.to_owned()],
    )?)
}

pub struct EchoProvider;

impl TranslationProvider for EchoProvider {
    fn translate(&self, batch: &TranslationBatch) -> Result<ProviderResponse, ProviderError> {
        Ok(ProviderResponse {
            schema_version: batch.schema_version(),
            translations: batch
                .targets()
                .iter()
                .rev()
                .map(|target| TargetSegment {
                    id: target.id(),
                    lines: target.lines().to_vec(),
                })
                .collect(),
        })
    }
}
