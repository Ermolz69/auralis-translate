use auralis_translation::{
    BlockPolicy, LanguageCode, LanguagePair, PlannedBatches, RunId, SceneMap, SegmentId,
    SourceHash, SourceSegment, TranslationId,
};
use std::collections::HashSet;
use std::error::Error;

const SCENE_CUES: u32 = 1000;
const CONTEXT_CUES: usize = 2;

fn owned_source(count: u32) -> Result<Vec<SourceSegment>, Box<dyn Error>> {
    (1..=count)
        .map(|number| {
            let id = SegmentId::new(number).ok_or("invalid fixture segment ID")?;
            let start = u64::from(number) * 1000;
            Ok(SourceSegment::new(
                id,
                start,
                start + 900,
                vec![format!("第{number}句。")],
            )?)
        })
        .collect()
}

fn scene_ends(count: u32) -> Result<Vec<SegmentId>, Box<dyn Error>> {
    (SCENE_CUES..count)
        .step_by(SCENE_CUES as usize)
        .chain(std::iter::once(count))
        .map(|number| SegmentId::new(number).ok_or_else(|| "invalid scene end".into()))
        .collect()
}

#[test]
fn long_scene_plans_cover_every_target_without_crossing_boundaries() -> Result<(), Box<dyn Error>> {
    let policy = BlockPolicy::with_context(1, CONTEXT_CUES, CONTEXT_CUES)
        .ok_or("invalid bounded context policy")?;
    for count in [1024_u32, 4096, 10000] {
        let source = owned_source(count)?;
        let scenes = SceneMap::new(&source, &scene_ends(count)?)?;
        let plan = PlannedBatches::with_scenes(
            &source,
            &scenes,
            TranslationId::parse("11111111-1111-4111-8111-111111111111")?,
            RunId::parse("22222222-2222-4222-8222-222222222222")?,
            SourceHash::digest(format!("owned-{count}").as_bytes()),
            LanguagePair::new(LanguageCode::Chinese, LanguageCode::Russian)?,
            policy,
            None,
        )?;
        assert_eq!(plan.batches().len(), count as usize);
        assert_eq!(plan.ids().len(), count as usize);
        let mut seen = HashSet::new();
        for (position, (batch, ids)) in plan.batches().iter().zip(plan.ids()).enumerate() {
            let target = u32::try_from(position)? + 1;
            assert_eq!(ids.len(), 1);
            assert_eq!(ids[0].get(), target);
            assert_eq!(batch.targets().len(), 1);
            assert_eq!(batch.targets()[0].id().get(), target);
            assert!(seen.insert(target));
            let scene_first = (target - 1) / SCENE_CUES * SCENE_CUES + 1;
            let scene_last = (scene_first + SCENE_CUES - 1).min(count);
            let expected_before = (scene_first..target)
                .rev()
                .take(CONTEXT_CUES)
                .collect::<Vec<_>>();
            let expected_after = ((target + 1)..=scene_last)
                .take(CONTEXT_CUES)
                .collect::<Vec<_>>();
            let expected = expected_before
                .into_iter()
                .rev()
                .chain(expected_after)
                .collect::<Vec<_>>();
            assert_eq!(
                batch
                    .context()
                    .iter()
                    .map(|cue| cue.id().get())
                    .collect::<Vec<_>>(),
                expected
            );
        }
        assert_eq!(seen.len(), count as usize);
        for edge in [1_u32, 500, 1000, 1001, count / 2, count] {
            assert_eq!(plan.ids()[(edge - 1) as usize][0].get(), edge);
        }
    }
    Ok(())
}
