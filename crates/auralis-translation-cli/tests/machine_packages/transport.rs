use crate::package_fixture::PackageFixture;
use crate::{download_proxy::DownloadProxy, package_process};
use std::{error::Error, process::Command};

#[test]
fn rejected_https_proxy_reports_download_failure_and_retains_prior_receipts()
-> Result<(), Box<dyn Error>> {
    for command in ["fetch-asset", "install-online"] {
        let fixture = PackageFixture::new(false)?;
        let destination = fixture.workspace.0.join("installed");
        let request_path = fixture.workspace.0.join("request.json");
        std::fs::write(
            &request_path,
            serde_json::to_vec(&fixture.request(command, &destination))?,
        )?;
        std::fs::remove_file(fixture.assets.join("MODEL-LICENSE.txt"))?;
        let proxy = DownloadProxy::rejecting()?;
        let output = Command::new(env!("CARGO_BIN_EXE_auralis-translation-cli"))
            .args(["--jsonl", "--request"])
            .arg(request_path)
            .env("HTTPS_PROXY", &proxy.url)
            .env("https_proxy", &proxy.url)
            .env("ALL_PROXY", &proxy.url)
            .env("all_proxy", &proxy.url)
            .env("NO_PROXY", "")
            .env("no_proxy", "")
            .output()?;
        let request = proxy.finish()?;
        assert!(
            request.starts_with("CONNECT huggingface.co:443 "),
            "{request}"
        );
        let events = package_process::failure(&output, 4, "download_failure")?;
        let cached = events
            .iter()
            .filter(|event| event["event"] == "asset_cached")
            .collect::<Vec<_>>();
        assert_eq!(cached.len(), usize::from(command == "install-online"));
        assert!(!destination.exists());
        assert!(!fixture.assets.join("MODEL-LICENSE.txt").exists());
        assert!(
            std::fs::read_dir(&fixture.assets)?.any(|entry| entry.is_ok_and(|entry| entry
                .file_name()
                .to_string_lossy()
                .starts_with("MODEL-LICENSE.txt.part.")))
        );
    }
    Ok(())
}

#[test]
fn broken_output_reader_does_not_install_or_download_before_start_delivery()
-> Result<(), Box<dyn Error>> {
    let fixture = PackageFixture::new(false)?;
    let destination = fixture.workspace.0.join("installed");
    let mut manifest: serde_json::Value =
        serde_json::from_slice(&std::fs::read(&fixture.manifest)?)?;
    manifest["id"] = serde_json::json!("x".repeat(128 * 1024));
    std::fs::write(&fixture.manifest, serde_json::to_vec(&manifest)?)?;
    let request_path = fixture.workspace.0.join("request.json");
    std::fs::write(
        &request_path,
        serde_json::to_vec(&fixture.request("install-online", &destination))?,
    )?;
    let mut child = Command::new(env!("CARGO_BIN_EXE_auralis-translation-cli"))
        .args(["--jsonl", "--request"])
        .arg(request_path)
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::null())
        .spawn()?;
    drop(child.stdout.take());
    assert_eq!(child.wait()?.code(), Some(6));
    assert!(!destination.exists());
    assert_eq!(std::fs::read_dir(&fixture.assets)?.count(), 4);
    Ok(())
}
