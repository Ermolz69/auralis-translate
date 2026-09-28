use auralis_translation::{
    ApprovedTerm, ApprovedTerms, LanguageCode, LanguagePair, RunId, SegmentId, SourceHash,
    TranslationId,
};
use auralis_translation_formats::srt::{SrtBlockPolicy, SrtRunPlan};
use std::error::Error;

#[test]
fn reviewed_terms_enter_only_owned_srt_target_block() -> Result<(), Box<dyn Error>> {
    let source = "1\n00:00:01,000 --> 00:00:02,000\n小王来了。\n\n2\n00:00:02,000 --> 00:00:03,000\n她等着。\n";
    let ids = [
        SegmentId::new(1).ok_or("id")?,
        SegmentId::new(2).ok_or("id")?,
    ];
    let terms = ApprovedTerms::new(vec![ApprovedTerm::new(
        "小王".into(),
        "Сяо Ван".into(),
        vec![],
        vec![ids[0]],
        "reviewer".into(),
        "evidence".into(),
    )?])?;
    let plan = SrtRunPlan::with_scene_map_and_terms(
        source.as_bytes(),
        TranslationId::parse("11111111-1111-4111-8111-111111111111")?,
        RunId::parse("22222222-2222-4222-8222-222222222222")?,
        LanguagePair::new(LanguageCode::Chinese, LanguageCode::Russian)?,
        SrtBlockPolicy::with_context(1, 1, 1).ok_or("policy")?,
        &ids[1..],
        SourceHash::digest(b"scene"),
        &terms,
    )?;
    assert_eq!(plan.blocks(), &[vec![ids[0]], vec![ids[1]]]);
    assert_eq!(plan.block_fingerprints().len(), 2);
    Ok(())
}
