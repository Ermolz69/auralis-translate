use auralis_translation::{
    BlockPolicy, ContractError, LanguageCode, LanguagePair, PlannedBatches, RunId, SegmentId,
    SourceHash, SourceSegment, TranslationId,
};

#[test]
fn planner_rejects_empty_and_duplicate_ids_across_distant_blocks()
-> Result<(), Box<dyn std::error::Error>> {
    let translation_id = TranslationId::parse("11111111-1111-4111-8111-111111111111")?;
    let run_id = RunId::parse("22222222-2222-4222-8222-222222222222")?;
    let pair = LanguagePair::new(LanguageCode::Chinese, LanguageCode::Russian)?;
    let source_hash = SourceHash::digest(b"source");
    let policy = BlockPolicy::new(1).ok_or("invalid block policy")?;
    assert!(matches!(
        PlannedBatches::new(&[], translation_id, run_id, source_hash, pair, policy, None),
        Err(ContractError::EmptyTargets)
    ));
    let one = SourceSegment::new(
        SegmentId::new(1).ok_or("invalid ID")?,
        0,
        1000,
        vec!["one".into()],
    )?;
    let two = SourceSegment::new(
        SegmentId::new(2).ok_or("invalid ID")?,
        1000,
        2000,
        vec!["two".into()],
    )?;
    let duplicate = SourceSegment::new(
        SegmentId::new(1).ok_or("invalid ID")?,
        2000,
        3000,
        vec!["three".into()],
    )?;
    assert!(matches!(
        PlannedBatches::new(
            &[one, two, duplicate],
            translation_id,
            run_id,
            source_hash,
            pair,
            policy,
            None
        ),
        Err(ContractError::DuplicateSegmentId)
    ));
    Ok(())
}
