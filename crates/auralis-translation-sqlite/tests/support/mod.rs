use auralis_translation::{
    LanguageCode, LanguagePair, RunId, SegmentId, SourceHash, TranslationId,
};
use auralis_translation_sqlite::{RunSpec, TranslationSpec};
use std::error::Error;
use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};

pub fn test_directory() -> Result<PathBuf, Box<dyn Error>> {
    let nonce = SystemTime::now().duration_since(UNIX_EPOCH)?.as_nanos();
    let path = std::env::temp_dir().join(format!(
        "auralis-translate-db-{}-{nonce}",
        std::process::id()
    ));
    std::fs::create_dir(&path)?;
    Ok(path)
}

pub fn translation_spec() -> Result<TranslationSpec, Box<dyn Error>> {
    Ok(TranslationSpec {
        translation_id: TranslationId::parse("11111111-1111-4111-8111-111111111111")?,
        project_id: Some("project-1".into()),
        source_artifact_id: Some("artifact-1".into()),
        source_locator: None,
        source_hash: SourceHash::digest(b"source"),
        source_format: "srt".into(),
        language_pair: LanguagePair::new(LanguageCode::Chinese, LanguageCode::Russian)?,
    })
}

pub fn run_spec() -> Result<RunSpec, Box<dyn Error>> {
    Ok(RunSpec {
        run_id: RunId::parse("22222222-2222-4222-8222-222222222222")?,
        translation_id: translation_spec()?.translation_id,
        source_hash: SourceHash::digest(b"source"),
        profile_fingerprint: "profile-sha256".into(),
        parser_version: 1,
        policy_fingerprint: "policy-sha256".into(),
        glossary_revision: None,
        blocks: vec![vec![SegmentId::new(1).ok_or("invalid test segment ID")?]],
    })
}
