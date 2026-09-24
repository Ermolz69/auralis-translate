mod support;

use auralis_translation::{
    LanguageCode, LanguagePair, ProviderError, ProviderResponse, TargetSegment, TranslationBatch,
    TranslationProvider,
};
use auralis_translation_formats::srt::{SrtBlockPolicy, SrtRunPlan};
use auralis_translation_sqlite::{RunStop, SqliteConfig, TranslateDb};
use std::cell::Cell;
use std::error::Error;
use support::{run_spec, test_directory, translation_spec};

const SOURCE: &[u8] = b"1\r\n00:00:01,000 --> 00:00:02,000\r\n\xe4\xbd\xa0\xe5\xa5\xbd\xe3\x80\x82\r\n\r\n2\r\n00:00:02,000 --> 00:00:03,000\r\n\xe5\x86\x8d\xe8\xa7\x81\xe3\x80\x82\r\n";

struct FailableProvider {
    calls: Cell<usize>,
    fail_on_call: Option<usize>,
}

impl TranslationProvider for FailableProvider {
    fn translate(&self, batch: &TranslationBatch) -> Result<ProviderResponse, ProviderError> {
        let call = self.calls.get() + 1;
        self.calls.set(call);
        if self.fail_on_call == Some(call) {
            return Err(ProviderError("injected failure".into()));
        }
        Ok(ProviderResponse {
            schema_version: 1,
            translations: batch
                .targets()
                .iter()
                .map(|segment| TargetSegment {
                    id: segment.id(),
                    lines: vec![format!("Русский {}.", segment.id())],
                })
                .collect(),
        })
    }
}

#[test]
fn renders_complete_copy_only_after_durable_resume() -> Result<(), Box<dyn Error>> {
    let directory = test_directory()?;
    let path = directory.join("auralis-translate.sqlite");
    let mut translation = translation_spec()?;
    translation.source_hash = auralis_translation::SourceHash::digest(SOURCE);
    let mut run = run_spec()?;
    run.source_hash = translation.source_hash;
    let plan = SrtRunPlan::new(
        SOURCE,
        translation.translation_id,
        run.run_id,
        LanguagePair::new(LanguageCode::Chinese, LanguageCode::Russian)?,
        SrtBlockPolicy::new(1).ok_or("invalid test block policy")?,
    )?;
    run.blocks = plan.blocks().to_vec();
    assert_eq!(plan.source_hash(), translation.source_hash);
    let mut db = TranslateDb::open(&path, SqliteConfig::default())?;
    db.ensure_translation(&translation)?;
    let attempt = db.begin_attempt(&run, None)?;
    let provider = FailableProvider {
        calls: Cell::new(0),
        fail_on_call: Some(2),
    };
    assert!(plan.execute(&provider, &mut db).is_err());
    assert_eq!(db.checkpoints(run.run_id)?.len(), 1);
    db.stop_attempt(run.run_id, attempt, RunStop::Failed, "model failed")?;
    drop(db);

    let mut db = TranslateDb::open(&path, SqliteConfig::default())?;
    db.begin_attempt(&run, None)?;
    let provider = FailableProvider {
        calls: Cell::new(0),
        fail_on_call: None,
    };
    let output = plan.execute(&provider, &mut db)?;
    assert_eq!(provider.calls.get(), 1);
    assert!(String::from_utf8(output.clone())?.contains("Русский 2."));
    assert_ne!(output, SOURCE);
    assert_eq!(
        auralis_translation::SourceHash::digest(SOURCE),
        translation.source_hash
    );
    drop(db);
    std::fs::remove_dir_all(directory)?;
    Ok(())
}
