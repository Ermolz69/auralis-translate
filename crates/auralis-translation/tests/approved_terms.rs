use auralis_translation::{
    ApprovedTerm, ApprovedTerms, BlockPolicy, ContractError, LanguageCode, LanguagePair,
    PlannedBatches, RunId, SceneMap, SegmentId, SourceHash, SourceSegment, TranslationId,
};
use std::error::Error;

fn ids(values: &[u32]) -> Result<Vec<SegmentId>, ContractError> {
    values
        .iter()
        .map(|value| SegmentId::new(*value).ok_or(ContractError::InvalidApprovedTerms))
        .collect()
}

fn source() -> Result<Vec<SourceSegment>, ContractError> {
    ["小王来了。", "她等着。", "小王走了。"]
        .into_iter()
        .enumerate()
        .map(|(index, line)| {
            SourceSegment::new(
                ids(&[(index + 1) as u32])?[0],
                index as u64 * 1000,
                (index as u64 + 1) * 1000,
                vec![line.into()],
            )
        })
        .collect()
}

fn term(target: &str, scope: &[u32], reviewer: &str) -> Result<ApprovedTerm, ContractError> {
    ApprovedTerm::new(
        "小王".into(),
        target.into(),
        vec![],
        ids(scope)?,
        reviewer.into(),
        "review-001".into(),
    )
}

#[test]
fn only_target_spelling_and_scope_enter_blocks_and_identity() -> Result<(), Box<dyn Error>> {
    let source = source()?;
    let map = SceneMap::new(&source, &ids(&[2, 3])?)?;
    let policy = BlockPolicy::with_context(1, 1, 1).ok_or("policy")?;
    let translation = TranslationId::parse("11111111-1111-4111-8111-111111111111")?;
    let run = RunId::parse("22222222-2222-4222-8222-222222222222")?;
    let pair = LanguagePair::new(LanguageCode::Chinese, LanguageCode::Russian)?;
    let hash = SourceHash::digest(b"source");
    let terms = ApprovedTerms::new(vec![
        term("Сяо Ван", &[1], "reviewer-a")?,
        term("Ван", &[3], "reviewer-a")?,
    ])?;
    terms.validate_against(&source)?;
    let plan = PlannedBatches::with_scenes_and_terms(
        &source,
        &map,
        translation,
        run,
        hash,
        pair,
        policy,
        &terms,
    )?;
    assert_eq!(plan.batches()[0].approved_terms()[0].target(), "Сяо Ван");
    assert!(plan.batches()[1].approved_terms().is_empty());
    assert_eq!(plan.batches()[2].approved_terms()[0].target(), "Ван");
    let changed = ApprovedTerms::new(vec![
        term("Сяо Ван", &[1], "reviewer-b")?,
        term("Ван", &[3], "reviewer-a")?,
    ])?;
    let changed_plan = PlannedBatches::with_scenes_and_terms(
        &source,
        &map,
        translation,
        run,
        hash,
        pair,
        policy,
        &changed,
    )?;
    assert_ne!(plan.fingerprints()[0], changed_plan.fingerprints()[0]);
    assert_eq!(plan.fingerprints()[1], changed_plan.fingerprints()[1]);
    Ok(())
}

#[test]
fn conflicting_or_absent_source_scope_fails_before_inference() -> Result<(), Box<dyn Error>> {
    assert!(matches!(
        ApprovedTerms::new(vec![term("А", &[1], "a")?, term("Б", &[1], "b")?]),
        Err(ContractError::ApprovedTermsConflict)
    ));
    let source = source()?;
    for scope in [&[2][..], &[4][..]] {
        assert!(
            ApprovedTerms::new(vec![term("Сяо Ван", scope, "a")?])?
                .validate_against(&source)
                .is_err()
        );
    }
    assert!(term("Сяо Ван", &[], "a").is_err());
    Ok(())
}
