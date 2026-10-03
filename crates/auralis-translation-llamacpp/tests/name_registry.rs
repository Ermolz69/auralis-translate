use auralis_translation::*;
use auralis_translation_llamacpp::{
    ModelProfile, name_registry_policy_sha256, render_v8_name_proposals,
};
use serde_json::{Value, json};
use std::error::Error;

#[test]
fn hints_are_exact_slot_scoped_and_empty_selection_keeps_v8_bytes() -> Result<(), Box<dyn Error>> {
    let segment = SourceSegment::new(
        SegmentId::new(1).ok_or("id")?,
        1000,
        2000,
        vec!["小王，请来。".into()],
    )?;
    let scenes = SceneMap::new(std::slice::from_ref(&segment), &[segment.id()])?;
    let registry = extract_source_names(
        TranslationId::parse("11111111-1111-4111-8111-111111111111")?,
        SourceHash::digest(b"source"),
        &[segment],
        &scenes,
    )?;
    let mut entities = registry.entries().to_vec();
    entities[0].proposal = Some(NameProposal {
        russian: "Сяо Ван".into(),
        origin: NameProposalOrigin::Model,
        evidence_id: "unreviewed-model".into(),
        reviewer_id: None,
    });
    let baseline = format!(
        "Translate. Input JSON:\n{}",
        json!({"schema_version":7,"target_slots":[
        {"segment_id":1,"line_index":0,"source_original":"小王，请来。","source_for_translation":"小王，请来。"},
        {"segment_id":2,"line_index":0,"source_original":"明天见。","source_for_translation":"明天见。"}],"source_context":[]})
    );
    let rendered = render_v8_name_proposals(&baseline, &entities, 8, 2048)?;
    let envelope: Value =
        serde_json::from_str(rendered.split_once("Input JSON:\n").ok_or("marker")?.1)?;
    assert_eq!(
        envelope["target_slots"][0]["name_proposals"][0]["russian_proposal"],
        "Сяо Ван"
    );
    assert_eq!(
        envelope["target_slots"][0]["name_proposals"][0]["status"],
        "needs_review"
    );
    assert!(envelope["target_slots"][1].get("name_proposals").is_none());
    let neighbor = format!(
        "Translate. Input JSON:\n{}",
        json!({"schema_version":7,"target_slots":[{"segment_id":2,"line_index":0,"source_original":"明天见。"}],"source_context":[{"segment_id":1,"source_original":"小王，请来。"}]})
    );
    assert_eq!(
        render_v8_name_proposals(&neighbor, &entities, 0, 0)?,
        neighbor
    );
    assert!(render_v8_name_proposals(&baseline, &entities, 0, 0).is_err());
    Ok(())
}

#[test]
fn separate_profile_identity_rejects_changed_registry_policy() -> Result<(), Box<dyn Error>> {
    let bytes = include_bytes!(
        "../../../models/manifests/hy_mt2_7b_q4_k_m.context_v8_target_first_batch1.experimental.json"
    );
    let mut payload: Value = serde_json::from_slice(bytes)?;
    ModelProfile::from_json(bytes)?;
    payload["name_registry_policy_sha256"] = name_registry_policy_sha256().into();
    payload["max_name_proposals_entries"] = 8.into();
    payload["max_name_proposals_bytes"] = 4096.into();
    ModelProfile::from_json(&serde_json::to_vec(&payload)?)?;
    payload["name_registry_policy_sha256"] = "wrong".into();
    assert!(ModelProfile::from_json(&serde_json::to_vec(&payload)?).is_err());
    Ok(())
}
