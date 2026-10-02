use auralis_translation_llamacpp::ModelProfile;
use std::error::Error;

const PROFILE: &[u8] =
    include_bytes!("../../../models/manifests/hy_mt2_1_8b_q4_k_m.experimental.json");
const CONTEXT_PROFILE: &[u8] =
    include_bytes!("../../../models/manifests/hy_mt2_1_8b_q4_k_m.context.experimental.json");
const GLOSSARY_PROFILE: &[u8] =
    include_bytes!("../../../models/manifests/hy_mt2_1_8b_q4_k_m.glossary.experimental.json");
const CHECKED_PROFILE: &[u8] =
    include_bytes!("../../../models/manifests/hy_mt2_1_8b_q4_k_m.checked.experimental.json");
const FIDELITY_PROFILE: &[u8] =
    include_bytes!("../../../models/manifests/hy_mt2_1_8b_q4_k_m.fidelity.experimental.json");
const LARGE_FIDELITY_PROFILE: &[u8] =
    include_bytes!("../../../models/manifests/hy_mt2_7b_q4_k_m.fidelity.experimental.json");
const V5_SCENE_PROFILE: &[u8] = include_bytes!(
    "../../../models/manifests/hy_mt2_1_8b_q4_k_m.context_v5_scene.experimental.json"
);
const V5_BASELINE_PROFILE: &[u8] =
    include_bytes!("../../../models/manifests/hy_mt2_1_8b_q4_k_m.context_v5.experimental.json");
const LARGE_V5_BASELINE_PROFILE: &[u8] =
    include_bytes!("../../../models/manifests/hy_mt2_7b_q4_k_m.context_v5.experimental.json");
const LARGE_V5_SCENE_PROFILE: &[u8] =
    include_bytes!("../../../models/manifests/hy_mt2_7b_q4_k_m.context_v5_scene.experimental.json");
const V6_SLOT_PROFILE: &[u8] = include_bytes!(
    "../../../models/manifests/hy_mt2_1_8b_q4_k_m.context_v6_slot.experimental.json"
);
const V7_BATCH_PROFILE: &[u8] = include_bytes!(
    "../../../models/manifests/hy_mt2_1_8b_q4_k_m.context_v7_batch4.experimental.json"
);

#[test]
fn v7_batch_profile_is_checked_and_cannot_resume_legacy_identity() -> Result<(), Box<dyn Error>> {
    let profile = ModelProfile::from_json(V7_BATCH_PROFILE)?;
    assert_eq!(profile.prompt_version, 7);
    assert_eq!(profile.target_segments_per_block, 4);
    assert_eq!(profile.min_context_tokens, Some(2048));
    let mut value: serde_json::Value = serde_json::from_slice(V7_BATCH_PROFILE)?;
    for (key, bad) in [
        ("prompt_version", serde_json::json!(6)),
        ("target_segments_per_block", serde_json::json!(9)),
        ("min_context_tokens", serde_json::Value::Null),
        ("token_safety_margin_tokens", serde_json::Value::Null),
        ("max_block_attempts", serde_json::json!(2)),
        ("retry_json_tail_once", serde_json::json!(true)),
        ("strict_source_identifiers", serde_json::json!(true)),
    ] {
        let mut changed = value.clone();
        changed[key] = bad;
        assert!(
            ModelProfile::from_json(&serde_json::to_vec(&changed)?).is_err(),
            "{key}"
        );
    }
    value["prompt_template_sha256"] = serde_json::json!("0".repeat(64));
    assert!(ModelProfile::from_json(&serde_json::to_vec(&value)?).is_err());
    assert!(ModelProfile::from_json(V6_SLOT_PROFILE).is_ok());
    Ok(())
}
const LARGE_V6_SLOT_PROFILE: &[u8] =
    include_bytes!("../../../models/manifests/hy_mt2_7b_q4_k_m.context_v6_slot.experimental.json");
const LARGE_V6_TAIL_RETRY_PROFILE: &[u8] = include_bytes!(
    "../../../models/manifests/hy_mt2_7b_q4_k_m.context_v6_slot_retry_tail.experimental.json"
);
const LARGE_V6_LENGTH_TAIL_RETRY_PROFILE: &[u8] = include_bytes!(
    "../../../models/manifests/hy_mt2_7b_q4_k_m.context_v6_slot_retry_tail_length.experimental.json"
);

#[test]
fn length_tail_retry_adds_only_its_explicit_checked_v6_flag() -> Result<(), Box<dyn Error>> {
    let baseline = ModelProfile::from_json(LARGE_V6_TAIL_RETRY_PROFILE)?;
    assert!(!baseline.retry_length_json_tail_once);
    let variant = ModelProfile::from_json(LARGE_V6_LENGTH_TAIL_RETRY_PROFILE)?;
    assert!(variant.retry_length_json_tail_once);
    let mut value: serde_json::Value = serde_json::from_slice(LARGE_V6_LENGTH_TAIL_RETRY_PROFILE)?;
    value
        .as_object_mut()
        .ok_or("variant must be an object")?
        .remove("retry_length_json_tail_once");
    assert_eq!(
        value,
        serde_json::from_slice::<serde_json::Value>(LARGE_V6_TAIL_RETRY_PROFILE)?
    );
    for (key, bad) in [
        ("retry_json_tail_once", serde_json::json!(false)),
        ("max_block_attempts", serde_json::json!(1)),
        ("prompt_version", serde_json::json!(5)),
        ("model_file_bytes", serde_json::Value::Null),
    ] {
        let mut value: serde_json::Value =
            serde_json::from_slice(LARGE_V6_LENGTH_TAIL_RETRY_PROFILE)?;
        value[key] = bad;
        assert!(
            ModelProfile::from_json(&serde_json::to_vec(&value)?).is_err(),
            "{key}"
        );
    }
    Ok(())
}

#[test]
fn json_tail_retry_is_explicit_bounded_and_keeps_the_v6_prompt() -> Result<(), Box<dyn Error>> {
    let baseline = ModelProfile::from_json(LARGE_V6_SLOT_PROFILE)?;
    assert!(!baseline.retry_json_tail_once);
    assert_eq!(baseline.max_block_attempts, 1);
    let retry = ModelProfile::from_json(LARGE_V6_TAIL_RETRY_PROFILE)?;
    assert!(retry.retry_json_tail_once);
    assert_eq!(retry.max_block_attempts, 2);
    let baseline_value: serde_json::Value = serde_json::from_slice(LARGE_V6_SLOT_PROFILE)?;
    let mut retry_value: serde_json::Value = serde_json::from_slice(LARGE_V6_TAIL_RETRY_PROFILE)?;
    retry_value
        .as_object_mut()
        .ok_or("retry profile must be an object")?
        .remove("retry_json_tail_once");
    retry_value
        .as_object_mut()
        .ok_or("retry profile must be an object")?
        .remove("max_block_attempts");
    assert_eq!(retry_value, baseline_value);
    for (key, bad) in [
        ("max_block_attempts", serde_json::json!(1)),
        ("max_block_attempts", serde_json::json!(3)),
        ("prompt_version", serde_json::json!(5)),
        ("model_file_bytes", serde_json::Value::Null),
    ] {
        let mut value: serde_json::Value = serde_json::from_slice(LARGE_V6_TAIL_RETRY_PROFILE)?;
        value[key] = bad;
        assert!(
            ModelProfile::from_json(&serde_json::to_vec(&value)?).is_err(),
            "{key}"
        );
    }
    Ok(())
}

#[test]
fn v6_slot_profile_has_new_identity_and_rejects_schema_downgrade() -> Result<(), Box<dyn Error>> {
    let profile = ModelProfile::from_json(V6_SLOT_PROFILE)?;
    assert_eq!(profile.prompt_version, 6);
    assert_eq!(profile.target_segments_per_block, 1);
    assert_eq!(profile.token_safety_margin_tokens, Some(64));
    let mut value: serde_json::Value = serde_json::from_slice(V6_SLOT_PROFILE)?;
    value["prompt_version"] = 5.into();
    assert!(ModelProfile::from_json(&serde_json::to_vec(&value)?).is_err());
    value["prompt_version"] = 6.into();
    value["prompt_template_sha256"] =
        serde_json::from_slice::<serde_json::Value>(V5_SCENE_PROFILE)?["prompt_template_sha256"]
            .clone();
    assert!(ModelProfile::from_json(&serde_json::to_vec(&value)?).is_err());
    assert!(ModelProfile::from_json(V5_SCENE_PROFILE).is_ok());
    Ok(())
}

#[test]
fn large_context_profiles_change_only_model_identity() -> Result<(), Box<dyn Error>> {
    for (small_bytes, large_bytes) in [
        (V5_BASELINE_PROFILE, LARGE_V5_BASELINE_PROFILE),
        (V5_SCENE_PROFILE, LARGE_V5_SCENE_PROFILE),
        (V6_SLOT_PROFILE, LARGE_V6_SLOT_PROFILE),
    ] {
        let large_profile = ModelProfile::from_json(large_bytes)?;
        assert_eq!(
            large_profile.prompt_version,
            ModelProfile::from_json(small_bytes)?.prompt_version
        );
        assert_eq!(large_profile.model_file_bytes, Some(4_624_648_896));
        let mut small: serde_json::Value = serde_json::from_slice(small_bytes)?;
        let mut large: serde_json::Value = serde_json::from_slice(large_bytes)?;
        for key in [
            "model_repo",
            "model_revision",
            "model_file_sha256",
            "model_file_bytes",
            "model_alias",
        ] {
            assert_ne!(small[key], large[key]);
            small
                .as_object_mut()
                .ok_or("small profile is not an object")?
                .remove(key);
            large
                .as_object_mut()
                .ok_or("large profile is not an object")?
                .remove(key);
        }
        assert_eq!(small, large);
    }
    Ok(())
}

#[test]
fn v5_scene_profile_requires_a_bounded_token_reserve() -> Result<(), Box<dyn Error>> {
    let profile = ModelProfile::from_json(V5_SCENE_PROFILE)?;
    assert_eq!(profile.prompt_version, 5);
    assert_eq!(profile.min_context_tokens, Some(2048));
    assert_eq!(profile.token_safety_margin_tokens, Some(64));
    let mut value: serde_json::Value = serde_json::from_slice(V5_SCENE_PROFILE)?;
    for bad in [
        serde_json::Value::Null,
        serde_json::json!(0),
        serde_json::json!(513),
    ] {
        value["token_safety_margin_tokens"] = bad;
        assert!(ModelProfile::from_json(&serde_json::to_vec(&value)?).is_err());
    }
    value["token_safety_margin_tokens"] = serde_json::json!(64);
    value["max_tokens_per_line"] = serde_json::json!(2048);
    assert!(ModelProfile::from_json(&serde_json::to_vec(&value)?).is_err());
    Ok(())
}

#[test]
fn model_sizes_share_policy_but_keep_separate_identity() -> Result<(), Box<dyn Error>> {
    let large = ModelProfile::from_json(LARGE_FIDELITY_PROFILE)?;
    assert_eq!(large.model_file_bytes, Some(4_624_648_896));
    assert_eq!(large.model_repo, "tencent/Hy-MT2-7B-GGUF");
    let mut small: serde_json::Value = serde_json::from_slice(FIDELITY_PROFILE)?;
    let mut large: serde_json::Value = serde_json::from_slice(LARGE_FIDELITY_PROFILE)?;
    for key in [
        "model_repo",
        "model_revision",
        "model_file_sha256",
        "model_file_bytes",
        "model_alias",
    ] {
        assert_ne!(small[key], large[key]);
        small
            .as_object_mut()
            .ok_or("profile object missing")?
            .remove(key);
        large
            .as_object_mut()
            .ok_or("profile object missing")?
            .remove(key);
    }
    assert_eq!(small, large);
    Ok(())
}

#[test]
fn fidelity_profile_is_versioned_without_changing_legacy_fingerprints() -> Result<(), Box<dyn Error>>
{
    let profile = ModelProfile::from_json(FIDELITY_PROFILE)?;
    assert_eq!(profile.prompt_version, 4);
    let mut legacy: serde_json::Value = serde_json::from_slice(CHECKED_PROFILE)?;
    legacy["prompt_version"] = serde_json::json!(4);
    assert_eq!(
        legacy,
        serde_json::from_slice::<serde_json::Value>(FIDELITY_PROFILE)?
    );
    for (key, bad) in [
        ("prompt_version", serde_json::json!(6)),
        ("context_before_segments", serde_json::json!(1)),
        ("max_context_bytes", serde_json::json!(4096)),
        ("max_glossary_entries", serde_json::json!(16)),
    ] {
        let mut value: serde_json::Value = serde_json::from_slice(FIDELITY_PROFILE)?;
        value[key] = bad;
        assert!(ModelProfile::from_json(&serde_json::to_vec(&value)?).is_err());
    }
    Ok(())
}

#[test]
fn pinned_experimental_profile_parses() -> Result<(), Box<dyn Error>> {
    let profile = ModelProfile::from_json(PROFILE)?;
    assert_eq!(profile.model_repo, "tencent/Hy-MT2-1.8B-GGUF");
    assert_eq!(profile.model_file_sha256.len(), 64);
    assert_eq!(profile.prompt_version, 1);
    assert_eq!(profile.target_segments_per_block, 8);
    assert_eq!(profile.context_before_segments, 0);
    assert_eq!(profile.max_block_attempts, 1);
    Ok(())
}

#[test]
fn context_profile_is_separate_and_bounded() -> Result<(), Box<dyn Error>> {
    let profile = ModelProfile::from_json(CONTEXT_PROFILE)?;
    assert_eq!(profile.prompt_version, 2);
    assert_eq!(profile.target_segments_per_block, 1);
    assert_eq!(profile.context_before_segments, 1);
    assert_eq!(profile.context_after_segments, 1);
    assert_eq!(profile.max_context_bytes, 4096);

    let mut json: serde_json::Value = serde_json::from_slice(CONTEXT_PROFILE)?;
    json["target_segments_per_block"] = serde_json::json!(2);
    assert!(ModelProfile::from_json(&serde_json::to_vec(&json)?).is_err());
    json["target_segments_per_block"] = serde_json::json!(1);
    json["max_context_bytes"] = serde_json::json!(0);
    assert!(ModelProfile::from_json(&serde_json::to_vec(&json)?).is_err());
    Ok(())
}

#[test]
fn glossary_profile_is_explicit_and_bounded() -> Result<(), Box<dyn Error>> {
    let profile = ModelProfile::from_json(GLOSSARY_PROFILE)?;
    assert_eq!(profile.prompt_version, 3);
    assert_eq!(profile.max_glossary_entries, 16);
    assert_eq!(profile.max_glossary_bytes, 4096);
    let mut json: serde_json::Value = serde_json::from_slice(GLOSSARY_PROFILE)?;
    json["max_glossary_entries"] = serde_json::json!(0);
    assert!(ModelProfile::from_json(&serde_json::to_vec(&json)?).is_err());
    json["max_glossary_entries"] = serde_json::json!(16);
    json["target_segments_per_block"] = serde_json::json!(2);
    assert!(ModelProfile::from_json(&serde_json::to_vec(&json)?).is_err());
    Ok(())
}

#[test]
fn checked_profile_requires_complete_runtime_identity() -> Result<(), Box<dyn Error>> {
    let profile = ModelProfile::from_json(CHECKED_PROFILE)?;
    assert_eq!(profile.model_file_bytes, Some(1_133_080_448));
    assert_eq!(
        profile.runtime_build_info.as_deref(),
        Some("b10977-0ecb159c9")
    );
    assert_eq!(profile.min_context_tokens, Some(2048));

    let mut json: serde_json::Value = serde_json::from_slice(CHECKED_PROFILE)?;
    json.as_object_mut()
        .ok_or("profile must be an object")?
        .remove("runtime_build_info");
    assert!(ModelProfile::from_json(&serde_json::to_vec(&json)?).is_err());
    Ok(())
}

#[test]
fn rejects_invalid_profile_limits_and_revision() -> Result<(), Box<dyn Error>> {
    for (key, bad) in [
        ("schema_version", serde_json::json!(2)),
        ("model_revision", serde_json::json!("")),
        ("temperature", serde_json::json!(4.0)),
        ("max_tokens_per_line", serde_json::json!(0)),
        ("timeout_seconds", serde_json::json!(0)),
        ("max_response_bytes", serde_json::json!(0)),
        ("max_block_attempts", serde_json::json!(4)),
    ] {
        let mut json: serde_json::Value = serde_json::from_slice(PROFILE)?;
        json[key] = bad;
        assert!(
            ModelProfile::from_json(&serde_json::to_vec(&json)?).is_err(),
            "key: {key}"
        );
    }
    Ok(())
}
