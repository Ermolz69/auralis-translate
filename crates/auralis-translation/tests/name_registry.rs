use auralis_translation::*;
use std::{error::Error, num::NonZeroU32};

fn segment(id: u32, text: &str) -> Result<SourceSegment, Box<dyn Error>> {
    Ok(SourceSegment::new(
        SegmentId::new(id).ok_or("id")?,
        u64::from(id) * 1000,
        u64::from(id) * 1000 + 900,
        vec![text.into()],
    )?)
}
fn extract(
    segments: &[SourceSegment],
    ends: &[u32],
) -> Result<(NameRegistry, SceneMap), Box<dyn Error>> {
    let scenes = SceneMap::new(
        segments,
        &ends
            .iter()
            .map(|id| SegmentId::new(*id).ok_or("id"))
            .collect::<Result<Vec<_>, _>>()?,
    )?;
    let registry = extract_source_names(
        TranslationId::parse("11111111-1111-4111-8111-111111111111")?,
        SourceHash::digest(b"source"),
        segments,
        &scenes,
    )?;
    Ok((registry, scenes))
}

#[test]
fn records_beginning_middle_end_without_reference_input() -> Result<(), Box<dyn Error>> {
    let segments = (1..=1024)
        .map(|id| {
            segment(
                id,
                if [1, 512, 1024].contains(&id) {
                    "😀小王，请进。"
                } else {
                    "等一下。"
                },
            )
        })
        .collect::<Result<Vec<_>, _>>()?;
    let (registry, scenes) = extract(&segments, &[1024])?;
    assert_eq!(registry.entries().len(), 1);
    let name = &registry.entries()[0];
    assert_eq!(name.chinese, "小王");
    assert_eq!(name.status, NameStatus::NeedsReview);
    assert!(name.proposal.is_none());
    assert_eq!(
        name.occurrences
            .iter()
            .map(|o| o.segment_id.get())
            .collect::<Vec<_>>(),
        [1, 512, 1024]
    );
    assert!(name.occurrences.iter().all(|o| o.bytes == (4..10)));
    registry.validate_against(&segments, &scenes)?;
    Ok(())
}

#[test]
fn similar_people_and_addresses_are_never_merged_by_surname() -> Result<(), Box<dyn Error>> {
    let segments = vec![
        segment(1, "我叫王宁。")?,
        segment(2, "我叫王凝。")?,
        segment(3, "小王，请来。")?,
        segment(4, "王老师，请坐。")?,
    ];
    let (registry, _) = extract(&segments, &[4])?;
    let names = registry
        .entries()
        .iter()
        .map(|e| e.chinese.as_str())
        .collect::<Vec<_>>();
    assert_eq!(names.len(), 4);
    for name in ["王宁", "王凝", "小王", "王老师"] {
        assert!(names.contains(&name));
    }
    assert!(
        registry
            .entries()
            .iter()
            .all(|e| e.possible_aliases.is_empty() && e.status == NameStatus::NeedsReview)
    );
    Ok(())
}

#[test]
fn scene_boundary_keeps_identical_surfaces_separate() -> Result<(), Box<dyn Error>> {
    let segments = vec![segment(1, "小王，请进。")?, segment(2, "小王，请坐。")?];
    let (registry, _) = extract(&segments, &[1, 2])?;
    assert_eq!(registry.entries().len(), 2);
    assert_ne!(registry.entries()[0].id, registry.entries()[1].id);
    assert_eq!(registry.entries()[0].occurrences[0].scene_index, 0);
    assert_eq!(registry.entries()[1].occurrences[0].scene_index, 1);
    Ok(())
}

#[test]
fn products_places_quoted_and_metalinguistic_controls_stay_out() -> Result<(), Box<dyn Error>> {
    let texts = [
        "小米手机很好。",
        "王府井在北京。",
        "小王子是一本书。",
        "“王老师”这个词怎么翻译？",
        "这个品牌叫小王。",
    ];
    let segments = texts
        .iter()
        .enumerate()
        .map(|(i, t)| segment(i as u32 + 1, t))
        .collect::<Result<Vec<_>, _>>()?;
    let (registry, _) = extract(&segments, &[5])?;
    assert!(registry.entries().is_empty());
    Ok(())
}

#[test]
fn known_name_must_not_activate_inside_a_product_or_title_compound() -> Result<(), Box<dyn Error>> {
    let segments = vec![
        segment(1, "小王，请进。")?,
        segment(2, "小王子是一本书。")?,
        segment(3, "王老师，请坐。")?,
        segment(4, "王老师奖是一项奖。")?,
        segment(5, "小王来了。")?,
        segment(6, "小王国很小。")?,
    ];
    let (registry, _) = extract(&segments, &[6])?;
    let wang = registry
        .entries()
        .iter()
        .find(|e| e.chinese == "小王")
        .ok_or("name")?;
    assert_eq!(
        wang.occurrences
            .iter()
            .map(|o| o.segment_id.get())
            .collect::<Vec<_>>(),
        [1, 5]
    );
    let teacher = registry
        .entries()
        .iter()
        .find(|e| e.chinese == "王老师")
        .ok_or("name")?;
    assert_eq!(
        teacher
            .occurrences
            .iter()
            .map(|o| o.segment_id.get())
            .collect::<Vec<_>>(),
        [3]
    );
    Ok(())
}

#[test]
fn neighbor_name_never_activates_target_hint_and_revisions_change_every_batch()
-> Result<(), Box<dyn Error>> {
    let segments = vec![segment(1, "小王，请进。")?, segment(2, "明天见。")?];
    let (registry, _) = extract(&segments, &[2])?;
    let mut entities = registry.entries().to_vec();
    entities[0].proposal = Some(NameProposal {
        russian: "Сяо Ван".into(),
        origin: NameProposalOrigin::Algorithm,
        evidence_id: "authored-source-only-proposal-v1".into(),
        reviewer_id: None,
    });
    let proposed = NameRegistry::new(
        registry.translation_id(),
        registry.source_hash(),
        registry.scene_hash(),
        registry.policy_id().into(),
        NonZeroU32::MIN,
        entities.clone(),
    )?;
    assert!(proposed.applicable(&segments[1..]).is_empty());
    assert_eq!(proposed.applicable(&segments[..1]).len(), 1);
    let pair = LanguagePair::new(LanguageCode::Chinese, LanguageCode::Russian)?;
    let batch = TranslationBatch::new(
        registry.translation_id(),
        RunId::parse("22222222-2222-4222-8222-222222222222")?,
        registry.source_hash(),
        pair,
        segments[1..].to_vec(),
        segments[..1].to_vec(),
    )?;
    let original = batch.clone().with_name_registry(&proposed)?;
    let revised = NameRegistry::new(
        registry.translation_id(),
        registry.source_hash(),
        registry.scene_hash(),
        registry.policy_id().into(),
        NonZeroU32::new(2).ok_or("revision")?,
        entities,
    )?;
    let new = batch.with_name_registry(&revised)?;
    assert!(original.name_entities().is_empty());
    assert_ne!(original.fingerprint(), new.fingerprint());
    Ok(())
}

#[test]
fn source_range_tampering_and_automated_approval_are_rejected() -> Result<(), Box<dyn Error>> {
    let segments = vec![segment(1, "小王，请进。")?];
    let (registry, scenes) = extract(&segments, &[1])?;
    let mut entities = registry.entries().to_vec();
    entities[0].occurrences[0].bytes = 1..6;
    let bad = NameRegistry::new(
        registry.translation_id(),
        registry.source_hash(),
        registry.scene_hash(),
        registry.policy_id().into(),
        registry.revision(),
        entities,
    )?;
    assert!(bad.validate_against(&segments, &scenes).is_err());
    let mut entities = registry.entries().to_vec();
    entities[0].status = NameStatus::Approved;
    entities[0].proposal = Some(NameProposal {
        russian: "Ван".into(),
        origin: NameProposalOrigin::Model,
        evidence_id: "model-only".into(),
        reviewer_id: None,
    });
    assert!(
        NameRegistry::new(
            registry.translation_id(),
            registry.source_hash(),
            registry.scene_hash(),
            registry.policy_id().into(),
            registry.revision(),
            entities
        )
        .is_err()
    );
    Ok(())
}
