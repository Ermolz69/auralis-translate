use auralis_translation::{
    ContractError, Glossary, GlossaryEntry, LanguageCode, LanguagePair, RunId, SegmentId,
    SourceHash, SourceSegment, TranslationBatch, TranslationId,
};
use std::error::Error;

fn id(number: u32) -> Result<SegmentId, Box<dyn Error>> {
    SegmentId::new(number).ok_or_else(|| "invalid segment ID".into())
}

#[test]
fn glossary_rejects_overlapping_terms_and_selects_relevant_scope() -> Result<(), Box<dyn Error>> {
    let first = GlossaryEntry::new(
        "阿明".into(),
        "Амин".into(),
        vec!["Амина".into()],
        Some(vec![id(1)?]),
    )?;
    let second = GlossaryEntry::new(
        "阿明".into(),
        "Артём".into(),
        Vec::new(),
        Some(vec![id(2)?]),
    )?;
    assert!(matches!(
        Glossary::new(vec![first.clone(), first.clone()]),
        Err(ContractError::GlossaryConflict)
    ));
    assert!(Glossary::new(vec![first.clone(), second.clone()]).is_ok());
    let global = GlossaryEntry::new("阿明".into(), "Амин".into(), Vec::new(), None)?;
    assert!(matches!(
        Glossary::new(vec![global, second]),
        Err(ContractError::GlossaryConflict)
    ));
    let glossary = Glossary::new(vec![first.clone()])?;
    let target = SourceSegment::new(id(1)?, 1000, 2000, vec!["你好。".into()])?;
    let context = SourceSegment::new(id(2)?, 2000, 3000, vec!["阿明来了。".into()])?;
    assert_eq!(
        glossary.applicable(
            std::slice::from_ref(&target),
            std::slice::from_ref(&context)
        ),
        vec![first.clone()]
    );
    assert!(glossary.applicable(&[context], &[target]).is_empty());
    Ok(())
}

#[test]
fn applied_terms_change_batch_fingerprint_without_changing_output_ids() -> Result<(), Box<dyn Error>>
{
    let target = SourceSegment::new(id(1)?, 1000, 2000, vec!["阿明来了。".into()])?;
    let translation_id = TranslationId::parse("11111111-1111-4111-8111-111111111111")?;
    let run_id = RunId::parse("22222222-2222-4222-8222-222222222222")?;
    let source_hash = SourceHash::digest(b"source");
    let pair = LanguagePair::new(LanguageCode::Chinese, LanguageCode::Russian)?;
    let plain = TranslationBatch::new(
        translation_id,
        run_id,
        source_hash,
        pair,
        vec![target.clone()],
        vec![],
    )?;
    let term = GlossaryEntry::new("阿明".into(), "Амин".into(), vec![], None)?;
    let with_term = TranslationBatch::with_glossary(
        translation_id,
        run_id,
        source_hash,
        pair,
        vec![target],
        vec![],
        vec![term],
    )?;
    assert_eq!(with_term.targets()[0].id(), plain.targets()[0].id());
    assert_ne!(with_term.fingerprint(), plain.fingerprint());
    Ok(())
}

#[test]
fn batch_rejects_glossary_scoped_only_to_another_target() -> Result<(), Box<dyn Error>> {
    let target = SourceSegment::new(id(1)?, 1000, 2000, vec!["阿明来了。".into()])?;
    let outside = GlossaryEntry::new("阿明".into(), "Амин".into(), vec![], Some(vec![id(2)?]))?;
    let batch = TranslationBatch::with_glossary(
        TranslationId::parse("11111111-1111-4111-8111-111111111111")?,
        RunId::parse("22222222-2222-4222-8222-222222222222")?,
        SourceHash::digest(b"source"),
        LanguagePair::new(LanguageCode::Chinese, LanguageCode::Russian)?,
        vec![target],
        vec![],
        vec![outside],
    );
    assert!(matches!(batch, Err(ContractError::InvalidGlossary)));
    Ok(())
}
