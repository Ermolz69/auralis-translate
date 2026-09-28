use auralis_translation::{
    BlockPolicy, ContractError, LanguageCode, LanguagePair, PlannedBatches, RunId, SceneMap,
    SegmentId, SourceHash, SourceSegment, TranslationId,
};
use std::error::Error;

fn segments() -> Result<Vec<SourceSegment>, Box<dyn Error>> {
    (1..=5)
        .map(|id| {
            let number = SegmentId::new(id).ok_or("invalid segment ID")?;
            Ok(SourceSegment::new(
                number,
                u64::from(id) * 1000,
                u64::from(id + 1) * 1000,
                vec![format!("source {id}")],
            )?)
        })
        .collect()
}

fn ids(values: &[u32]) -> Result<Vec<SegmentId>, Box<dyn Error>> {
    values
        .iter()
        .map(|id| SegmentId::new(*id).ok_or_else(|| "invalid scene end".into()))
        .collect()
}

#[test]
fn scene_boundaries_limit_context_and_keep_each_target_once() -> Result<(), Box<dyn Error>> {
    let source = segments()?;
    let map = SceneMap::new(&source, &ids(&[3, 5])?)?;
    let policy = BlockPolicy::with_context(1, 1, 1).ok_or("invalid policy")?;
    let plans = PlannedBatches::with_scenes(
        &source,
        &map,
        TranslationId::parse("11111111-1111-4111-8111-111111111111")?,
        RunId::parse("22222222-2222-4222-8222-222222222222")?,
        SourceHash::digest(b"source"),
        LanguagePair::new(LanguageCode::Chinese, LanguageCode::Russian)?,
        policy,
        None,
    )?;
    assert_eq!(
        plans
            .ids()
            .iter()
            .flatten()
            .map(|id| id.get())
            .collect::<Vec<_>>(),
        [1, 2, 3, 4, 5]
    );
    let context_ids = plans
        .batches()
        .iter()
        .map(|batch| {
            batch
                .context()
                .iter()
                .map(|segment| segment.id().get())
                .collect::<Vec<_>>()
        })
        .collect::<Vec<_>>();
    assert_eq!(
        context_ids,
        [vec![2], vec![1, 3], vec![2], vec![5], vec![4]]
    );
    assert_ne!(
        map.fingerprint(),
        SceneMap::new(&source, &ids(&[2, 5])?)?.fingerprint()
    );
    Ok(())
}

#[test]
fn scene_map_rejects_missing_repeated_reversed_and_foreign_boundaries() -> Result<(), Box<dyn Error>>
{
    let source = segments()?;
    for ends in [&[3][..], &[3, 3, 5], &[4, 2, 5], &[3, 6]] {
        assert!(matches!(
            SceneMap::new(&source, &ids(ends)?),
            Err(ContractError::InvalidSceneMap)
        ));
    }
    let map = SceneMap::new(&source, &ids(&[3, 5])?)?;
    let mut changed = source.clone();
    changed.swap(0, 1);
    assert!(!map.matches(&changed));
    Ok(())
}

#[test]
fn explicit_single_scene_matches_legacy_planning_but_has_its_own_identity()
-> Result<(), Box<dyn Error>> {
    let source = segments()?;
    let map = SceneMap::new(&source, &ids(&[5])?)?;
    let translation = TranslationId::parse("11111111-1111-4111-8111-111111111111")?;
    let run = RunId::parse("22222222-2222-4222-8222-222222222222")?;
    let hash = SourceHash::digest(b"source");
    let pair = LanguagePair::new(LanguageCode::Chinese, LanguageCode::Russian)?;
    let policy = BlockPolicy::with_context(1, 1, 1).ok_or("invalid policy")?;
    let legacy = PlannedBatches::new(&source, translation, run, hash, pair, policy, None)?;
    let explicit =
        PlannedBatches::with_scenes(&source, &map, translation, run, hash, pair, policy, None)?;
    assert_eq!(legacy.ids(), explicit.ids());
    assert_eq!(legacy.fingerprints(), explicit.fingerprints());
    Ok(())
}
