#[path = "support/download_proxy.rs"]
mod download_proxy;
#[path = "support/machine_workspace.rs"]
mod machine_workspace;
#[path = "support/package_fixture.rs"]
mod package_fixture;
#[path = "support/package_process.rs"]
mod package_process;
#[path = "machine_packages/transport.rs"]
mod transport;

use auralis_translation::SourceHash;
use package_fixture::PackageFixture;
use package_process::{events, failure, invoke, invoke_request};
use serde_json::{Value, json};
use std::{error::Error, fs::OpenOptions, path::Path};

fn receipt_matches_file(receipt: &Value) -> Result<(), Box<dyn Error>> {
    let bytes = std::fs::read(receipt["path"].as_str().ok_or("missing asset path")?)?;
    assert_eq!(receipt["bytes"], bytes.len());
    assert_eq!(receipt["sha256"], SourceHash::digest(&bytes).to_string());
    Ok(())
}

#[test]
fn all_package_requests_have_verified_receipts_in_both_output_modes() -> Result<(), Box<dyn Error>>
{
    let fixture = PackageFixture::new(false)?;
    for command in [
        "fetch-release",
        "fetch-asset",
        "install-offline",
        "install-online",
    ] {
        for mode in ["--json", "--jsonl"] {
            let install_root = fixture.workspace.0.join(format!("{command}{mode}"));
            let request = fixture.request(command, &install_root);
            let output = invoke_request(&request, &fixture.workspace.0.join("request.json"), mode)?;
            assert_eq!(
                output.status.code(),
                Some(0),
                "{}",
                String::from_utf8_lossy(&output.stderr)
            );
            let (package, installation, asset_receipts) = if mode == "--json" {
                let summary: Value = serde_json::from_slice(&output.stdout)?;
                assert_eq!(summary["schema_version"], 1);
                assert_eq!(summary["command"], command);
                assert_eq!(summary["terminal"]["exit_code"], 0);
                assert!(
                    summary["run"].is_null()
                        && summary["model"].is_null()
                        && summary["result"].is_null()
                );
                let receipts = if summary["asset"].is_null() {
                    vec![]
                } else {
                    vec![summary["asset"].clone()]
                };
                (
                    summary["package"].clone(),
                    summary["installation"].clone(),
                    receipts,
                )
            } else {
                let events = events(&output)?;
                assert_eq!(events[0]["event"], "package_started");
                assert_eq!(events.last().ok_or("missing terminal")?["exit_code"], 0);
                let receipts = events
                    .iter()
                    .filter(|event| event["event"] == "asset_cached")
                    .cloned()
                    .collect::<Vec<_>>();
                let expected = match command {
                    "fetch-asset" => 1,
                    "install-offline" => 0,
                    _ => 4,
                };
                assert_eq!(receipts.len(), expected);
                for (index, receipt) in receipts.iter().enumerate() {
                    assert_eq!(receipt["verified_assets"], index + 1);
                    assert_eq!(receipt["total_assets"], expected);
                }
                (
                    events[0].clone(),
                    events
                        .iter()
                        .find(|event| event["event"] == "package_installed")
                        .cloned()
                        .unwrap_or(Value::Null),
                    receipts,
                )
            };
            assert_eq!(package["release_id"], fixture.release_id);
            assert_eq!(package["backend"], "cpu");
            assert_eq!(
                package["manifest_sha256"],
                SourceHash::digest(&std::fs::read(&fixture.manifest)?).to_string()
            );
            assert_eq!(
                package["profile_sha256"],
                SourceHash::digest(&std::fs::read(&fixture.profile)?).to_string()
            );
            for receipt in &asset_receipts {
                receipt_matches_file(receipt)?;
            }
            if command.starts_with("install-") {
                let root = install_root.join(&fixture.release_id).join("cpu");
                assert_eq!(installation["root"], json!(root));
                assert_eq!(
                    std::fs::read(
                        installation["model_file"]
                            .as_str()
                            .ok_or("missing model path")?
                    )?,
                    std::fs::read(fixture.assets.join("Hy-MT2-1.8B-Q4_K_M.gguf"))?
                );
                assert_eq!(
                    std::fs::read(
                        installation["profile_file"]
                            .as_str()
                            .ok_or("missing profile path")?
                    )?,
                    std::fs::read(&fixture.profile)?
                );
                assert_eq!(
                    std::fs::read(root.join("release.json"))?,
                    std::fs::read(&fixture.manifest)?
                );
                assert_eq!(
                    std::fs::read(
                        installation["executable"]
                            .as_str()
                            .ok_or("missing executable path")?
                    )?,
                    b"synthetic executable, never run"
                );
                assert!(!root.join("translation-runtime.json").exists());
                assert!(!root.join("auralis-translate.sqlite").exists());
            } else {
                assert!(installation.is_null());
            }
        }
    }
    Ok(())
}

#[test]
fn bad_package_requests_fail_before_asset_or_installation_work() -> Result<(), Box<dyn Error>> {
    let fixture = PackageFixture::new(false)?;
    let destination = fixture.workspace.0.join("installed");
    let valid = fixture.request("install-online", &destination);
    for request in [
        {
            let mut request = valid.clone();
            request["request"]["backend"] = json!("unavailable");
            request
        },
        {
            let mut request = valid.clone();
            request["request"]["unexpected"] = json!(true);
            request
        },
        {
            let mut request = valid.clone();
            request["request"]
                .as_object_mut()
                .ok_or("missing object")?
                .remove("profile");
            request
        },
        {
            let mut request = fixture.request("fetch-asset", &destination);
            request["request"]["filename"] = json!("../escape.gguf");
            request
        },
    ] {
        let output = invoke_request(
            &request,
            &fixture.workspace.0.join("request.json"),
            "--jsonl",
        )?;
        assert_eq!(failure(&output, 2, "invalid_input")?.len(), 1);
        assert!(!destination.exists());
    }
    let output = invoke(&["--jsonl".into(), "install-online".into()])?;
    failure(&output, 2, "usage")?;
    std::fs::write(&fixture.profile, b"{}")?;
    let output = invoke_request(&valid, &fixture.workspace.0.join("request.json"), "--jsonl")?;
    assert_eq!(failure(&output, 2, "invalid_input")?.len(), 1);
    Ok(())
}

#[test]
fn later_corrupt_cache_entry_retains_prior_receipt_without_installation()
-> Result<(), Box<dyn Error>> {
    let fixture = PackageFixture::new(false)?;
    let destination = fixture.workspace.0.join("installed");
    std::fs::write(fixture.assets.join("MODEL-LICENSE.txt"), b"corrupt")?;
    for mode in ["--jsonl", "--json"] {
        let output = invoke_request(
            &fixture.request("install-online", &destination),
            &fixture.workspace.0.join("request.json"),
            mode,
        )?;
        if mode == "--jsonl" {
            let events = failure(&output, 7, "asset_mismatch")?;
            assert_eq!(events.len(), 3);
            assert_eq!(events[1]["event"], "asset_cached");
            assert_eq!(events[1]["verified_assets"], 1);
            assert_eq!(events[1]["total_assets"], 4);
            receipt_matches_file(&events[1])?;
        } else {
            assert_eq!(output.status.code(), Some(7));
            let summary: Value = serde_json::from_slice(&output.stdout)?;
            assert_eq!(summary["asset"]["verified_assets"], 1);
            assert_eq!(summary["terminal"]["code"], "asset_mismatch");
            assert!(summary["installation"].is_null());
        }
        assert!(!destination.exists());
    }
    assert_eq!(
        std::fs::read(fixture.assets.join("MODEL-LICENSE.txt"))?,
        b"corrupt"
    );
    Ok(())
}

#[test]
fn installed_package_conflict_preserves_existing_bytes_and_cached_receipts()
-> Result<(), Box<dyn Error>> {
    let fixture = PackageFixture::new(false)?;
    let destination = fixture.workspace.0.join("installed");
    let final_root = destination.join(&fixture.release_id).join("cpu");
    std::fs::create_dir_all(&final_root)?;
    std::fs::write(final_root.join("owner.txt"), b"existing data")?;
    let output = invoke_request(
        &fixture.request("install-online", &destination),
        &fixture.workspace.0.join("request.json"),
        "--jsonl",
    )?;
    let events = failure(&output, 7, "conflict")?;
    assert_eq!(
        events
            .iter()
            .filter(|event| event["event"] == "asset_cached")
            .count(),
        4
    );
    assert_eq!(
        std::fs::read(final_root.join("owner.txt"))?,
        b"existing data"
    );
    assert_eq!(std::fs::read_dir(final_root)?.count(), 1);
    Ok(())
}

#[test]
fn busy_download_cache_has_conflict_without_a_verified_asset_event() -> Result<(), Box<dyn Error>> {
    let fixture = PackageFixture::new(false)?;
    let lock = OpenOptions::new()
        .write(true)
        .create(true)
        .truncate(false)
        .open(fixture.assets.join("MODEL-LICENSE.txt.download.lock"))?;
    lock.lock()?;
    let output = invoke_request(
        &fixture.request("fetch-asset", &fixture.workspace.0),
        &fixture.workspace.0.join("request.json"),
        "--jsonl",
    )?;
    let events = failure(&output, 7, "conflict")?;
    assert_eq!(events.len(), 2);
    Ok(())
}

#[test]
fn offline_failure_does_not_publish_corrupt_missing_or_unsafe_package() -> Result<(), Box<dyn Error>>
{
    for (kind, exit, code) in [
        ("corrupt", 7, "asset_mismatch"),
        ("missing", 6, "io_failure"),
        ("unsafe", 2, "invalid_package"),
    ] {
        let fixture = PackageFixture::new(kind == "unsafe")?;
        let model = fixture.assets.join("Hy-MT2-1.8B-Q4_K_M.gguf");
        if kind == "corrupt" {
            std::fs::write(&model, b"corrupt")?;
        }
        if kind == "missing" {
            std::fs::remove_file(&model)?;
        }
        let destination = fixture.workspace.0.join("installed");
        let output = invoke_request(
            &fixture.request("install-offline", &destination),
            &fixture.workspace.0.join("request.json"),
            "--jsonl",
        )?;
        assert_eq!(failure(&output, exit, code)?.len(), 2);
        assert!(!destination.join(&fixture.release_id).join("cpu").exists());
        assert!(!destination.join("escaped.txt").exists());
        assert_eq!(
            std::fs::read_dir(destination.join(&fixture.release_id))?.count(),
            0
        );
    }
    Ok(())
}

#[test]
fn positional_machine_and_legacy_output_use_the_same_installation() -> Result<(), Box<dyn Error>> {
    let fixture = PackageFixture::new(false)?;
    for mode in ["--jsonl", "legacy"] {
        let destination = fixture.workspace.0.join(mode);
        let mut args = vec![
            "install-online".into(),
            fixture.manifest.clone().into(),
            fixture.profile.clone().into(),
            "cpu".into(),
            fixture.assets.clone().into(),
            destination.clone().into(),
        ];
        if mode != "legacy" {
            args.insert(0, mode.into());
        }
        let output = invoke(&args)?;
        assert_eq!(output.status.code(), Some(0));
        if mode == "legacy" {
            let lines = std::str::from_utf8(&output.stdout)?
                .lines()
                .collect::<Vec<_>>();
            assert_eq!(lines.len(), 8);
            assert!(
                lines[..4]
                    .iter()
                    .all(|line| line.starts_with("cached_asset="))
            );
            for (line, prefix) in lines[4..].iter().zip([
                "installed_root=",
                "installed_executable=",
                "installed_model=",
                "installed_profile=",
            ]) {
                assert!(line.starts_with(prefix));
            }
        } else {
            assert_eq!(events(&output)?.len(), 7);
        }
        assert!(destination.join(&fixture.release_id).join("cpu").is_dir());
    }
    let output = invoke(&[
        "install-offline".into(),
        fixture.manifest.clone().into(),
        fixture.profile.clone().into(),
        "cpu".into(),
        fixture.assets.clone().into(),
        fixture.workspace.0.join("legacy").into(),
    ])?;
    assert_eq!(output.status.code(), Some(1));
    assert!(output.stdout.is_empty());
    Ok(())
}

#[test]
fn relative_cache_and_source_paths_are_rejected() -> Result<(), Box<dyn Error>> {
    let fixture = PackageFixture::new(false)?;
    for (command, field, code) in [
        ("fetch-release", "cache_dir", "invalid_input"),
        ("install-offline", "source_dir", "invalid_package"),
    ] {
        let destination = fixture.workspace.0.join("installed");
        let mut request = fixture.request(command, &destination);
        request["request"][field] = json!(Path::new("relative"));
        let output = invoke_request(
            &request,
            &fixture.workspace.0.join("request.json"),
            "--jsonl",
        )?;
        failure(&output, 2, code)?;
        assert!(!destination.exists());
    }
    Ok(())
}
