use auralis_translation::*;
use auralis_translation_llamacpp::{
    LlamaCppProvider, ModelProfile, check_name_proposal_admission, name_proposal_admission_sha256,
    render_v8_name_proposals,
};
use serde_json::{Value, json};
use std::{error::Error, num::NonZeroU32};

const FROZEN: &[u8] =
    include_bytes!("../../../eval/reports/2026-10-03-source-name-registry-v1.json");
const CONTROLS: &[u8] =
    include_bytes!("../../../eval/corpora/name-action-admission-development-v1.json");

fn segment(id: u32, source: &str) -> Result<SourceSegment, Box<dyn Error>> {
    Ok(SourceSegment::new(
        SegmentId::new(id).ok_or("id")?,
        u64::from(id) * 1000,
        u64::from(id) * 1000 + 900,
        vec![source.into()],
    )?)
}

fn control_prompts(case: &Value) -> Result<(String, String), Box<dyn Error>> {
    let id = u32::try_from(case["target_id"].as_u64().ok_or("id")?)?;
    let target = segment(id, case["source"].as_str().ok_or("source")?)?;
    let context_text = case["context"].as_array().ok_or("context")?;
    let context = context_text
        .iter()
        .enumerate()
        .map(|(i, text)| {
            segment(
                if id == 1 {
                    id + 1 + i as u32
                } else {
                    id - context_text.len() as u32 + i as u32
                },
                text.as_str().ok_or("text")?,
            )
        })
        .collect::<Result<Vec<_>, Box<dyn Error>>>()?;
    let mut source = vec![target.clone()];
    source.extend(context.iter().cloned());
    source.sort_by_key(|s| s.id().get());
    let mut ends = Vec::new();
    if case["separate_context_scene"] == true {
        ends.push(source[source.len() - 2].id());
    }
    ends.push(source.last().ok_or("last")?.id());
    let scenes = SceneMap::new(&source, &ends)?;
    let registry = extract_source_names(
        TranslationId::parse("11111111-1111-4111-8111-111111111111")?,
        SourceHash::digest(b"owned-source"),
        &source,
        &scenes,
    )?;
    let mut entities = registry.entries().to_vec();
    for entity in &mut entities {
        entity.proposal = Some(NameProposal {
            russian: if case["name"] == entity.chinese {
                case["proposal"].as_str().ok_or("proposal")?.into()
            } else {
                "unseen neighbor proposal".into()
            },
            origin: NameProposalOrigin::Model,
            evidence_id: "authored-source-only-control".into(),
            reviewer_id: None,
        });
    }
    let registry = NameRegistry::new(
        registry.translation_id(),
        registry.source_hash(),
        scenes.fingerprint(),
        SOURCE_NAME_EXTRACTION_POLICY.into(),
        NonZeroU32::new(1).ok_or("revision")?,
        entities,
    )?;
    registry.validate_against(&source, &scenes)?;
    let batch = TranslationBatch::new(
        registry.translation_id(),
        RunId::parse("22222222-2222-4222-8222-222222222222")?,
        registry.source_hash(),
        LanguagePair::new(LanguageCode::Chinese, LanguageCode::Russian)?,
        vec![target],
        context,
    )?
    .with_name_registry(&registry)?;
    let selected = batch.name_entities();
    assert!(selected.iter().all(|e| e.status == NameStatus::NeedsReview));
    if case["name"].is_null() {
        assert!(selected.is_empty());
    } else {
        assert!(selected.iter().any(|e| case["name"] == e.chinese));
    }
    let context: Vec<_> = batch
        .context()
        .iter()
        .filter(|s| {
            case["separate_context_scene"] != true
                || scenes.ranges().iter().any(|range| {
                    source[range.clone()].iter().any(|x| x.id() == s.id())
                        && source[range.clone()]
                            .iter()
                            .any(|x| x.id() == batch.targets()[0].id())
                })
        })
        .map(|s| json!({"segment_id":s.id().get(),"line_index":0,"source_original":s.lines()[0]}))
        .collect();
    let baseline = format!(
        "Translate source target slots only. Input JSON:\n{}",
        json!({
        "schema_version":7,"target_slots":[{"segment_id":id,"line_index":0,
        "source_original":case["source"],"source_for_translation":case["source"]}],"source_context":context})
    );
    let rendered = render_v8_name_proposals(&baseline, selected, 8, 4096)?;
    Ok((baseline, rendered))
}

#[test]
fn offline_screen() -> Result<(), Box<dyn Error>> {
    let frozen: Value = serde_json::from_slice(FROZEN)?;
    let mut observations = Vec::new();
    for original in frozen["observations"].as_array().ok_or("observations")? {
        let payload: Value =
            serde_json::from_str(original["rendered_request"].as_str().ok_or("request")?)?;
        let prompt = payload["messages"][0]["content"].as_str().ok_or("prompt")?;
        let result = check_name_proposal_admission(prompt);
        let named = !original["hints"].as_array().ok_or("hints")?.is_empty();
        assert_eq!(result.is_err(), named);
        if let Err(error) = &result {
            assert!(matches!(
                error,
                ProviderError::NameProposalReviewRequired(_)
            ));
            assert!(!error.is_retryable());
        }
        observations.push(json!({"original":original,"replay_outcome":if named {"name_proposal_review_required"} else {"unchanged_structural_path"},
            "error":result.err().map(|e|e.to_string()),"new_accepted_checkpoint":null,
            "acceptance_is_simulated":true,"new_model_calls":0}));
    }
    assert_eq!(observations.len(), 84);
    assert_eq!(
        observations
            .iter()
            .filter(|o| o["replay_outcome"] == "name_proposal_review_required")
            .count(),
        33
    );
    let fixture: Value = serde_json::from_slice(CONTROLS)?;
    let mut controls = Vec::new();
    for case in fixture["cases"].as_array().ok_or("cases")? {
        let (baseline, guarded) = control_prompts(case)?;
        let named = !case["name"].is_null();
        assert_eq!(check_name_proposal_admission(&guarded).is_err(), named);
        if !named {
            assert_eq!(baseline.as_bytes(), guarded.as_bytes());
        }
        assert!(check_name_proposal_admission(&baseline).is_ok());
        controls.push(json!({"case":case,"baseline_prompt":baseline,"candidate_prompt":guarded,
            "replay_outcome":if named {"name_proposal_review_required"} else {"unchanged_structural_path"},
            "raw_response":null,"accepted_checkpoint":null,"model_calls":0,
            "missing_response_reason":"Deterministic admission control; no inference, no semantic quality judgment."}));
    }
    assert_eq!(controls.len(), 20);
    if let Ok(file) = std::env::var("NAME_ACTION_REPLAY_REPORT") {
        use std::io::Write;
        let mut file = std::fs::OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(file)?;
        file.write_all(
            serde_json::to_string_pretty(
                &json!({"frozen_replays":observations,"controls":controls,
            "admission_policy_sha256":name_proposal_admission_sha256(),"new_chat_calls":0,
            "human_review_count":0,"candidate":"fail_closed_admission_only_v1"}),
            )?
            .as_bytes(),
        )?;
    }
    Ok(())
}

#[test]
fn admission_pin_is_separate_and_legacy_profile_still_loads() -> Result<(), Box<dyn Error>> {
    let mut profile: Value = serde_json::from_slice(include_bytes!(
        "../../../models/manifests/hy_mt2_1_8b_q4_k_m.context_v8_source_names_batch1.experimental.json"
    ))?;
    ModelProfile::from_json(&serde_json::to_vec(&profile)?)?;
    profile["name_proposal_admission_sha256"] = name_proposal_admission_sha256().into();
    ModelProfile::from_json(&serde_json::to_vec(&profile)?)?;
    profile["name_proposal_admission_sha256"] = "wrong".into();
    assert!(ModelProfile::from_json(&serde_json::to_vec(&profile)?).is_err());
    Ok(())
}

#[test]
fn malformed_or_other_slot_metadata_never_silently_bypasses_barrier() {
    assert!(check_name_proposal_admission("bad prompt").is_err());
    assert!(
        check_name_proposal_admission("Input JSON:\n{\"target_slots\":[{\"name_proposals\":{}}]}")
            .is_err()
    );
    let prompt = "Input JSON:\n{\"target_slots\":[{\"segment_id\":1,\"line_index\":0},{\"segment_id\":2,\"line_index\":0,\"name_proposals\":[{}]}]}";
    assert!(matches!(
        check_name_proposal_admission(prompt),
        Err(ProviderError::NameProposalReviewRequired(_))
    ));
}

#[test]
fn legacy_active_proposal_refuses_before_any_http_request() -> Result<(), Box<dyn Error>> {
    let source = vec![segment(1, "小李，你几点能来？")?];
    let scene = SceneMap::new(&source, &[source[0].id()])?;
    let registry = extract_source_names(
        TranslationId::parse("11111111-1111-4111-8111-111111111111")?,
        SourceHash::digest(b"source"),
        &source,
        &scene,
    )?;
    let mut entries = registry.entries().to_vec();
    entries[0].proposal = Some(NameProposal {
        russian: "Сяо Ли".into(),
        origin: NameProposalOrigin::Model,
        evidence_id: "unreviewed".into(),
        reviewer_id: None,
    });
    let registry = NameRegistry::new(
        registry.translation_id(),
        registry.source_hash(),
        scene.fingerprint(),
        SOURCE_NAME_EXTRACTION_POLICY.into(),
        NonZeroU32::new(1).ok_or("revision")?,
        entries,
    )?;
    let batch = TranslationBatch::new(
        registry.translation_id(),
        RunId::parse("22222222-2222-4222-8222-222222222222")?,
        registry.source_hash(),
        LanguagePair::new(LanguageCode::Chinese, LanguageCode::Russian)?,
        source,
        Vec::new(),
    )?
    .with_name_registry(&registry)?;
    let profile = ModelProfile::from_json(include_bytes!(
        "../../../models/manifests/hy_mt2_1_8b_q4_k_m.context_v8_source_names_batch1.experimental.json"
    ))?;
    let provider = LlamaCppProvider::new("http://127.0.0.1:1/", profile)?;
    assert!(matches!(
        provider.translate(&batch),
        Err(ProviderError::NameProposalReviewRequired(_))
    ));
    Ok(())
}
