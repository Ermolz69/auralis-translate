use auralis_translation_llamacpp::ReleaseManifest;
use serde_json::{Value, json};
use std::error::Error;

const PROFILE: &[u8] =
    include_bytes!("../../../models/manifests/hy_mt2_1_8b_q4_k_m.checked.experimental.json");
const MANIFEST: &[u8] =
    include_bytes!("../../../models/releases/hy_mt2_1_8b_q4_k_m.windows_x64_cpu.experimental.json");

#[test]
fn pinned_windows_cpu_release_matches_checked_profile() -> Result<(), Box<dyn Error>> {
    let release = ReleaseManifest::from_json(MANIFEST, PROFILE)?;
    assert_eq!(release.target_triple, "x86_64-pc-windows-msvc");
    assert_eq!(release.variants().len(), 1);
    assert_eq!(release.variants()[0].backend, "cpu");
    Ok(())
}

#[test]
fn rejects_unpinned_or_unsafe_release_assets() -> Result<(), Box<dyn Error>> {
    let cases = [
        ("/model/file/url", json!("http://huggingface.co/model")),
        (
            "/model/file/url",
            json!(
                "https://example.com/resolve/a0c709d9fac510f2c807aa3af52872340dc37a4a/model.gguf"
            ),
        ),
        ("/model/file/filename", json!("../model.gguf")),
        ("/model/file/sha256", json!("0")),
        ("/model/file/bytes", json!(0)),
        ("/model/license/notice/bytes", json!(null)),
        (
            "/model/file/url",
            json!(
                "https://huggingface.co/tencent/Hy-MT2-1.8B-GGUF/resolve/main/Hy-MT2-1.8B-Q4_K_M.gguf?expected=/resolve/a0c709d9fac510f2c807aa3af52872340dc37a4a/"
            ),
        ),
        ("/runtime/variants/0/archive/sha256", json!("0")),
        (
            "/runtime/variants/0/archive/url",
            json!("https://github.com/ggml-org/llama.cpp/releases/download/main/llama.zip"),
        ),
        ("/runtime/variants/0/backend", json!("../cpu")),
        ("/profile_sha256", json!("0")),
    ];
    for (pointer, value) in cases {
        let mut manifest: Value = serde_json::from_slice(MANIFEST)?;
        *manifest
            .pointer_mut(pointer)
            .ok_or("manifest pointer missing")? = value;
        assert!(
            ReleaseManifest::from_json(&serde_json::to_vec(&manifest)?, PROFILE).is_err(),
            "manifest accepted invalid {pointer}"
        );
    }
    Ok(())
}

#[test]
fn rejects_profile_drift_and_duplicate_backends() -> Result<(), Box<dyn Error>> {
    let mut profile: Value = serde_json::from_slice(PROFILE)?;
    profile["runtime_build_info"] = json!("b10978-changed");
    assert!(ReleaseManifest::from_json(MANIFEST, &serde_json::to_vec(&profile)?).is_err());

    let mut manifest: Value = serde_json::from_slice(MANIFEST)?;
    let variant = manifest["runtime"]["variants"][0].clone();
    manifest["runtime"]["variants"]
        .as_array_mut()
        .ok_or("variants must be an array")?
        .push(variant);
    assert!(ReleaseManifest::from_json(&serde_json::to_vec(&manifest)?, PROFILE).is_err());
    Ok(())
}

#[test]
fn rejects_asset_filenames_that_collide_in_the_download_cache() -> Result<(), Box<dyn Error>> {
    let mut manifest: Value = serde_json::from_slice(MANIFEST)?;
    manifest["model"]["license"]["notice"]["filename"] = json!("hy-mt2-1.8b-q4_k_m.gguf");
    let release = ReleaseManifest::from_json(&serde_json::to_vec(&manifest)?, PROFILE)?;
    assert!(release.assets_for_backend("cpu").is_err());
    Ok(())
}
