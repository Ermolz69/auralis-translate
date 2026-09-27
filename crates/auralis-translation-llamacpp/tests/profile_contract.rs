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
        ("prompt_version", serde_json::json!(5)),
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
