use auralis_translation::*;
use auralis_translation_formats::{inspect, srt::SrtRunPlan};
use std::error::Error;

#[test]
fn registry_cannot_redefine_the_plans_scene_boundary() -> Result<(), Box<dyn Error>> {
    let source = "1\n00:00:01,000 --> 00:00:02,000\n小王，请进。\n\n2\n00:00:02,000 --> 00:00:03,000\n小王，请坐。\n";
    let segments = inspect(source.as_bytes())?.source_segments()?;
    let translation = TranslationId::parse("11111111-1111-4111-8111-111111111111")?;
    let run = RunId::parse("22222222-2222-4222-8222-222222222222")?;
    let pair = LanguagePair::new(LanguageCode::Chinese, LanguageCode::Russian)?;
    let policy = BlockPolicy::with_context(1, 1, 1).ok_or("policy")?;
    let ends = [segments[1].id()];
    let plan = || {
        SrtRunPlan::with_scene_map(
            source.as_bytes(),
            translation,
            run,
            pair,
            policy,
            &ends,
            SourceHash::digest(b"scene"),
        )
    };
    let split_ends = [segments[0].id(), segments[1].id()];
    let split = SceneMap::new(&segments, &split_ends)?;
    let registry = extract_source_names(
        translation,
        SourceHash::digest(source.as_bytes()),
        &segments,
        &split,
    )?;
    assert!(plan()?.with_name_registry(&registry, &split_ends).is_err());
    let whole = SceneMap::new(&segments, &ends)?;
    let registry = extract_source_names(
        translation,
        SourceHash::digest(source.as_bytes()),
        &segments,
        &whole,
    )?;
    let baseline = plan()?;
    let baseline_policy = baseline.policy_fingerprint_for_run(policy);
    let extended = baseline.with_name_registry(&registry, &ends)?;
    assert_ne!(extended.policy_fingerprint_for_run(policy), baseline_policy);
    Ok(())
}
