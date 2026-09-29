use auralis_translation::{
    BlockCheckpoint, CheckpointStore, ContractError, DiagnosticCode, LanguageCode, LanguagePair,
    ProviderError, ProviderResponse, RunControl, RunId, SegmentId, SourceHash, SourceSegment,
    TargetSegment, TranslateBatchError, TranslateRunError, TranslationBatch, TranslationDiagnostic,
    TranslationId, TranslationProvider, translate_planned_run,
};
use std::{error::Error, io};

struct Provider {
    text: String,
    diagnostics: Vec<TranslationDiagnostic>,
}

impl TranslationProvider for Provider {
    fn translate(&self, batch: &TranslationBatch) -> Result<ProviderResponse, ProviderError> {
        Ok(ProviderResponse {
            schema_version: batch.schema_version(),
            translations: vec![TargetSegment {
                id: batch.targets()[0].id(),
                lines: vec![self.text.clone()],
            }],
        })
    }

    fn translate_with_control_and_diagnostics(
        &self,
        batch: &TranslationBatch,
        _: &dyn RunControl,
    ) -> Result<(ProviderResponse, Vec<TranslationDiagnostic>), ProviderError> {
        Ok((self.translate(batch)?, self.diagnostics.clone()))
    }
}

#[derive(Default)]
struct Store(Vec<BlockCheckpoint>);

impl CheckpointStore for Store {
    type Error = io::Error;

    fn load(&self, _: RunId) -> Result<Vec<BlockCheckpoint>, Self::Error> {
        Ok(self.0.clone())
    }

    fn commit(&mut self, checkpoint: &BlockCheckpoint) -> Result<(), Self::Error> {
        self.0.push(checkpoint.clone());
        Ok(())
    }
}

fn batch(source: &str) -> Result<TranslationBatch, Box<dyn Error>> {
    Ok(TranslationBatch::new(
        TranslationId::parse("11111111-1111-4111-8111-111111111111")?,
        RunId::parse("22222222-2222-4222-8222-222222222222")?,
        SourceHash::digest(b"source"),
        LanguagePair::new(LanguageCode::Chinese, LanguageCode::Russian)?,
        vec![SourceSegment::new(
            SegmentId::new(1).ok_or("invalid target ID")?,
            0,
            1000,
            vec![source.into()],
        )?],
        vec![SourceSegment::new(
            SegmentId::new(2).ok_or("invalid context ID")?,
            1000,
            2000,
            vec!["旁白。".into()],
        )?],
    )?)
}

fn flag(segment: u32, line_index: u32) -> Result<TranslationDiagnostic, Box<dyn Error>> {
    Ok(TranslationDiagnostic {
        code: DiagnosticCode::SourcePrefixInserted,
        segment_id: SegmentId::new(segment).ok_or("invalid diagnostic segment ID")?,
        line_index,
    })
}

#[test]
fn valid_provider_review_flag_is_saved_without_a_false_mismatch() -> Result<(), Box<dyn Error>> {
    let batch = batch("工程 AUR-0002：不要打开这扇门。")?;
    let provider = Provider {
        text: "AUR-0002: Не открывайте эту дверь.".into(),
        diagnostics: vec![flag(1, 0)?],
    };
    let mut store = Store::default();
    let output = translate_planned_run(
        &provider,
        &mut store,
        &[vec![batch.targets()[0].id()]],
        &[batch],
    )?;
    assert_eq!(output[0].lines, [provider.text]);
    assert_eq!(store.0.len(), 1);
    assert_eq!(store.0[0].diagnostics.len(), 1);
    assert_eq!(
        store.0[0].diagnostics[0].code,
        DiagnosticCode::SourcePrefixInserted
    );
    Ok(())
}

#[test]
fn provider_cannot_flag_context_missing_or_duplicate_target_lines() -> Result<(), Box<dyn Error>> {
    let cases = [
        (
            "工程 AUR-0002：不要打开这扇门。",
            "AUR-0002: Не открывайте эту дверь.",
            vec![flag(2, 0)?],
        ),
        (
            "工程 AUR-0002：不要打开这扇门。",
            "AUR-0002: Не открывайте эту дверь.",
            vec![flag(1, 1)?],
        ),
        (
            "工程 AUR-0002：不要打开这扇门。",
            "AUR-0002: Не открывайте эту дверь.",
            vec![flag(1, 0)?, flag(1, 0)?],
        ),
        (
            "不要打开这扇门。",
            "Не открывайте эту дверь.",
            vec![flag(1, 0)?],
        ),
        (
            "工程 AUR-0002：不要打开这扇门。",
            "Не открывайте эту дверь.",
            vec![flag(1, 0)?],
        ),
    ];
    for (source, text, diagnostics) in cases {
        let batch = batch(source)?;
        let mut store = Store::default();
        let result = translate_planned_run(
            &Provider {
                text: text.into(),
                diagnostics,
            },
            &mut store,
            &[vec![batch.targets()[0].id()]],
            &[batch],
        );
        assert!(matches!(
            result,
            Err(TranslateRunError::Batch(TranslateBatchError::Contract(
                ContractError::ResponseDiagnostics
            )))
        ));
        assert!(store.0.is_empty());
    }
    Ok(())
}

#[test]
fn legacy_provider_without_flags_keeps_existing_checkpoint_behavior() -> Result<(), Box<dyn Error>>
{
    let batch = batch("工程 AUR-0002：不要打开这扇门。")?;
    let mut store = Store::default();
    let output = translate_planned_run(
        &Provider {
            text: "AUR-0002: Не открывайте эту дверь.".into(),
            diagnostics: vec![],
        },
        &mut store,
        &[vec![batch.targets()[0].id()]],
        &[batch],
    )?;
    assert_eq!(output.len(), 1);
    assert!(store.0[0].diagnostics.is_empty());
    Ok(())
}

#[test]
fn resume_rejects_a_flag_whose_saved_text_lost_the_source_code() -> Result<(), Box<dyn Error>> {
    let batch = batch("工程 AUR-0002：不要打开这扇门。")?;
    let target_id = batch.targets()[0].id();
    let provider = Provider {
        text: "AUR-0002: Не открывайте эту дверь.".into(),
        diagnostics: vec![flag(1, 0)?],
    };
    let mut store = Store::default();
    translate_planned_run(
        &provider,
        &mut store,
        &[vec![target_id]],
        std::slice::from_ref(&batch),
    )?;
    store.0[0].accepted[0].lines[0] = "Не открывайте эту дверь.".into();
    assert!(matches!(
        translate_planned_run(&provider, &mut store, &[vec![target_id]], &[batch]),
        Err(TranslateRunError::InvalidCheckpoint(_))
    ));
    assert_eq!(store.0.len(), 1);
    Ok(())
}
