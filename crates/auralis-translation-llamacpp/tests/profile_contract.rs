use auralis_translation_llamacpp::ModelProfile;
use std::error::Error;

const PROFILE: &[u8] =
    include_bytes!("../../../models/manifests/hy_mt2_1_8b_q4_k_m.experimental.json");
const CONTEXT_PROFILE: &[u8] =
    include_bytes!("../../../models/manifests/hy_mt2_1_8b_q4_k_m.context.experimental.json");

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
