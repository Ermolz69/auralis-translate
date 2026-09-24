use auralis_translation::{
    BlockCheckpoint, CheckpointStore, LanguageCode, LanguagePair, ProviderError, ProviderResponse,
    RunId, SegmentId, TargetSegment, TranslationBatch, TranslationId, TranslationProvider,
};
use auralis_translation_formats::srt::{SrtBlockPolicy, SrtRunPlan};
use std::{cell::RefCell, error::Error, io};

const SOURCE: &[u8] = b"1\n00:00:01,000 --> 00:00:02,000\nA\n\n2\n00:00:02,000 --> 00:00:03,000\nB\n\n3\n00:00:03,000 --> 00:00:04,000\nC\n";

struct RecordingProvider(RefCell<Vec<Vec<SegmentId>>>);

impl TranslationProvider for RecordingProvider {
    fn translate(&self, batch: &TranslationBatch) -> Result<ProviderResponse, ProviderError> {
        self.0
            .borrow_mut()
            .push(batch.context().iter().map(|segment| segment.id()).collect());
        Ok(ProviderResponse {
            schema_version: batch.schema_version(),
            translations: batch
                .targets()
                .iter()
                .map(|segment| TargetSegment {
                    id: segment.id(),
                    lines: segment.lines().to_vec(),
                })
                .collect(),
        })
    }
}

#[derive(Default)]
struct MemoryStore(Vec<BlockCheckpoint>);

impl CheckpointStore for MemoryStore {
    type Error = io::Error;

    fn load(&self, _: RunId) -> Result<Vec<BlockCheckpoint>, Self::Error> {
        Ok(self.0.clone())
    }

    fn commit(&mut self, checkpoint: &BlockCheckpoint) -> Result<(), Self::Error> {
        self.0.push(checkpoint.clone());
        Ok(())
    }
}

#[test]
fn adjacent_context_is_read_only_and_changes_frozen_block_identity() -> Result<(), Box<dyn Error>> {
    let translation_id = TranslationId::parse("11111111-1111-4111-8111-111111111111")?;
    let run_id = RunId::parse("22222222-2222-4222-8222-222222222222")?;
    let pair = LanguagePair::new(LanguageCode::Chinese, LanguageCode::Russian)?;
    let contextual = SrtBlockPolicy::with_context(1, 1, 1).ok_or("invalid policy")?;
    let plain = SrtBlockPolicy::new(1).ok_or("invalid policy")?;
    let plan = SrtRunPlan::new(SOURCE, translation_id, run_id, pair, contextual)?;
    let provider = RecordingProvider(RefCell::new(Vec::new()));
    let mut store = MemoryStore::default();
    assert_eq!(plan.execute(&provider, &mut store)?, SOURCE);
    let observed = provider.0.into_inner();
    assert_eq!(
        observed,
        vec![
            vec![SegmentId::new(2).ok_or("invalid ID")?],
            vec![
                SegmentId::new(1).ok_or("invalid ID")?,
                SegmentId::new(3).ok_or("invalid ID")?
            ],
            vec![SegmentId::new(2).ok_or("invalid ID")?],
        ]
    );
    assert_eq!(store.0.len(), 3);
    assert_ne!(
        SrtRunPlan::policy_fingerprint(contextual),
        SrtRunPlan::policy_fingerprint(plain)
    );
    assert_ne!(
        plan.block_fingerprints(),
        SrtRunPlan::new(SOURCE, translation_id, run_id, pair, plain)?.block_fingerprints()
    );
    Ok(())
}
