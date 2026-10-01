use auralis_translation::{
    BlockCheckpoint, CheckpointStore, LanguageCode, LanguagePair, ProgressSink, ProviderError,
    ProviderResponse, RetryPolicy, RunControl, RunId, RunProgress, TargetSegment, TranslationBatch,
    TranslationId, TranslationProvider,
};
use auralis_translation_formats::srt::{SrtBlockPolicy, SrtRunPlan};
use std::{cell::Cell, error::Error, io};

const SOURCE: &[u8] =
    "1\n00:00:00,000 --> 00:00:01,000\n你好。\n\n2\n00:00:01,000 --> 00:00:02,000\n口音。\n"
        .as_bytes();

struct TwoCueProvider {
    second: String,
    calls: Cell<usize>,
}

impl TranslationProvider for TwoCueProvider {
    fn translate(&self, batch: &TranslationBatch) -> Result<ProviderResponse, ProviderError> {
        self.calls.set(self.calls.get() + 1);
        Ok(ProviderResponse {
            schema_version: batch.schema_version(),
            translations: batch
                .targets()
                .iter()
                .map(|target| TargetSegment {
                    id: target.id(),
                    lines: vec![if target.id().get() == 1 {
                        "Привет.".into()
                    } else {
                        self.second.clone()
                    }],
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

struct NoopProgress;
impl ProgressSink for NoopProgress {
    fn report(&mut self, _: RunProgress) {}
}

struct NoPause;
impl RunControl for NoPause {
    fn pause_requested(&self, _: RunId) -> Result<bool, Box<dyn Error>> {
        Ok(false)
    }
}

fn plan() -> Result<SrtRunPlan, Box<dyn Error>> {
    Ok(SrtRunPlan::new(
        SOURCE,
        TranslationId::parse("11111111-1111-4111-8111-111111111111")?,
        RunId::parse("22222222-2222-4222-8222-222222222222")?,
        LanguagePair::new(LanguageCode::Chinese, LanguageCode::Russian)?,
        SrtBlockPolicy::new(1).ok_or("invalid block policy")?,
    )?)
}

#[test]
fn raw_ying_failure_family_cannot_enter_second_checkpoint() -> Result<(), Box<dyn Error>> {
    let cases = [
        "У каждого городка тоже свой акцент」}]}{}   Wait, the JSON structure should be {"
            .to_owned(),
        "У каждого городка тоже свой {акцент}".to_owned(),
        "Планирование началось за 36 месяцев до запуска」}]}".to_owned(),
        "Планирование началось за 36 месяцев до запуска}]}".to_owned(),
        "Если бы при 9 Вт работали только 4 ядра」}]}".to_owned(),
        "Если бы при 9 Вт работали только 4 ядра}]}".to_owned(),
        "При 9W активны 4 ядра」}]}".to_owned(),
        "По сравнению с другими кухнями, кантонская кухня」}]}".to_owned(),
        "Ли Хуайбо」}]}".to_owned(),
        "Восемь десертов」 } ] }".to_owned(),
        "У каждого городка тоже свой <b>акцент</b>".to_owned(),
        "У каждого городка тоже свой акцент >".to_owned(),
        "а".repeat(16 * 1024 + 1),
    ];
    for second in cases {
        let provider = TwoCueProvider {
            second,
            calls: Cell::new(0),
        };
        let mut store = MemoryStore::default();
        let result = plan()?.execute_with_policy(
            &provider,
            &mut store,
            &mut NoopProgress,
            &NoPause,
            RetryPolicy::default(),
        );
        let error = match result {
            Ok(_) => return Err("SRT-invalid target was accepted".into()),
            Err(error) => error,
        };
        assert!(
            error
                .to_string()
                .contains("SRT target line violates supported text grammar")
        );
        assert_eq!(provider.calls.get(), 2);
        assert_eq!(
            store.0.len(),
            1,
            "invalid target entered durable checkpoint"
        );
    }
    Ok(())
}

#[test]
fn related_safe_punctuation_and_names_keep_full_coverage() -> Result<(), Box<dyn Error>> {
    for second in [
        "У каждого городка свой акцент.",
        "Танхэ и Тунбай — разные уезды.",
        "«Акцент» — слово в кавычках.",
        "Код REG-020 сохранён.",
        "Совместное планирование vivo и MediaTek началось за 36 месяцев.",
        "«36 месяцев» — срок раннего планирования.",
        "При 9 Вт работают только 4 ядра.",
        "«4 ядра» при мощности 9 Вт.",
        "При 9W доступны 4 ядра.",
        "Кантонская кухня отличается вкусом.",
        "«Кантонская кухня» — название традиции.",
        "Кантонская кухня — это традиция.",
    ] {
        let provider = TwoCueProvider {
            second: second.into(),
            calls: Cell::new(0),
        };
        let mut store = MemoryStore::default();
        let output = plan()?.execute_with_policy(
            &provider,
            &mut store,
            &mut NoopProgress,
            &NoPause,
            RetryPolicy::default(),
        )?;
        assert!(std::str::from_utf8(&output)?.contains(second));
        assert_eq!(provider.calls.get(), 2);
        assert_eq!(store.0.len(), 2);
    }
    Ok(())
}
