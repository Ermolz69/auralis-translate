use auralis_translation_llamacpp::{
    ReleaseManifest, install_offline, verify_runtime_files, verify_runtime_files_with_control,
};
use std::error::Error;
use std::path::Path;

#[path = "support/offline_install_fixture.rs"]
mod offline_install_fixture;
use offline_install_fixture::{Fixture, fixture_with_archive, make_zip};

#[test]
fn reporting_failure_keeps_verified_asset_and_stops_before_next_asset() -> Result<(), Box<dyn Error>>
{
    let root = tempfile::tempdir()?;
    let fixture = fixture(root.path(), false)?;
    let mut calls = 0;
    let result = auralis_translation_llamacpp::download_release_assets_with_observer(
        &fixture.manifest,
        &fixture.profile,
        "cpu",
        &fixture.sources,
        |asset, path| {
            calls += 1;
            assert_eq!(asset.filename, "Hy-MT2-1.8B-Q4_K_M.gguf");
            assert_eq!(std::fs::read(path)?, b"tiny fixture model");
            Err(std::io::Error::new(
                std::io::ErrorKind::BrokenPipe,
                "disconnected controller",
            ))
        },
    );
    assert!(
        matches!(result, Err(auralis_translation_llamacpp::AssetDownloadError::Io(error)) if error.kind() == std::io::ErrorKind::BrokenPipe)
    );
    assert_eq!(calls, 1);
    assert!(fixture.sources.join("Hy-MT2-1.8B-Q4_K_M.gguf").is_file());
    assert!(
        !fixture
            .sources
            .join("MODEL-LICENSE.txt.download.lock")
            .exists()
    );
    Ok(())
}

#[test]
fn interrupted_runtime_verification_keeps_the_installed_package() -> Result<(), Box<dyn Error>> {
    let root = tempfile::tempdir()?;
    let fixture = fixture(root.path(), false)?;
    let destination = root.path().join("installed");
    let manifest = ReleaseManifest::from_json(&fixture.manifest, &fixture.profile)?;
    let installed = install_offline(
        &fixture.manifest,
        &fixture.profile,
        "cpu",
        &fixture.sources,
        &destination,
    )?;
    let checks = std::cell::Cell::new(0);
    let control = || {
        checks.set(checks.get() + 1);
        if checks.get() == 8 {
            Err(auralis_translation::ProviderError::Permanent(
                "verification cancelled".into(),
            ))
        } else {
            Ok(())
        }
    };
    let result = verify_runtime_files_with_control(
        &installed.root.join("assets"),
        &installed.root.join("runtime"),
        &manifest.variants()[0],
        &control,
    );
    assert!(
        matches!(result, Err(auralis_translation_llamacpp::OfflineInstallError::Preparation(error)) if error.to_string() == "verification cancelled")
    );
    assert_eq!(checks.get(), 8);
    verify_runtime_files(
        &installed.root.join("assets"),
        &installed.root.join("runtime"),
        &manifest.variants()[0],
    )?;
    Ok(())
}

fn fixture(root: &Path, unsafe_zip: bool) -> Result<Fixture, Box<dyn Error>> {
    fixture_with_archive(root, |archive| {
        make_zip(
            archive,
            if unsafe_zip {
                "../escaped.txt"
            } else {
                "llama-server.exe"
            },
        )
    })
}

#[test]
fn installs_only_verified_files_and_preserves_notices() -> Result<(), Box<dyn Error>> {
    let root = tempfile::tempdir()?;
    let fixture = fixture(root.path(), false)?;
    let destination = root.path().join("installed");
    let installed = install_offline(
        &fixture.manifest,
        &fixture.profile,
        "cpu",
        &fixture.sources,
        &destination,
    )?;
    assert_eq!(std::fs::read(&installed.executable)?, b"stub server");
    assert_eq!(std::fs::read(&installed.model_file)?, b"tiny fixture model");
    assert_eq!(std::fs::read(&installed.profile_file)?, fixture.profile);
    assert_eq!(
        std::fs::read(installed.root.join("notices/MODEL-LICENSE.txt"))?,
        b"fixture model license"
    );
    assert_eq!(
        std::fs::read(installed.root.join("release.json"))?,
        fixture.manifest
    );
    Ok(())
}

#[test]
fn runtime_verification_detects_same_length_changes_and_extra_files() -> Result<(), Box<dyn Error>>
{
    let root = tempfile::tempdir()?;
    let fixture = fixture(root.path(), false)?;
    let installed = install_offline(
        &fixture.manifest,
        &fixture.profile,
        "cpu",
        &fixture.sources,
        &root.path().join("installed"),
    )?;
    let manifest = ReleaseManifest::from_json(&fixture.manifest, &fixture.profile)?;
    let variant = &manifest.variants()[0];
    let assets = installed.root.join("assets");
    let runtime = installed.root.join("runtime");
    verify_runtime_files(&assets, &runtime, variant)?;
    std::fs::write(&installed.executable, b"bad! server")?;
    assert!(verify_runtime_files(&assets, &runtime, variant).is_err());
    std::fs::write(&installed.executable, b"stub server")?;
    std::fs::write(runtime.join("injected.dll"), b"undeclared")?;
    assert!(verify_runtime_files(&assets, &runtime, variant).is_err());
    Ok(())
}

#[test]
fn corrupted_weights_never_become_selectable() -> Result<(), Box<dyn Error>> {
    let root = tempfile::tempdir()?;
    let fixture = fixture(root.path(), false)?;
    std::fs::write(
        fixture.sources.join("Hy-MT2-1.8B-Q4_K_M.gguf"),
        b"corrupted",
    )?;
    let destination = root.path().join("installed");
    assert!(
        install_offline(
            &fixture.manifest,
            &fixture.profile,
            "cpu",
            &fixture.sources,
            &destination
        )
        .is_err()
    );
    assert!(
        !destination
            .join("hy-mt2-1-8b-q4-windows-x64-cpu-b10977/cpu")
            .exists()
    );
    Ok(())
}

#[test]
fn archive_path_escape_never_becomes_selectable() -> Result<(), Box<dyn Error>> {
    let root = tempfile::tempdir()?;
    let fixture = fixture(root.path(), true)?;
    let destination = root.path().join("installed");
    assert!(
        install_offline(
            &fixture.manifest,
            &fixture.profile,
            "cpu",
            &fixture.sources,
            &destination
        )
        .is_err()
    );
    assert!(
        !destination
            .join("hy-mt2-1-8b-q4-windows-x64-cpu-b10977/cpu")
            .exists()
    );
    assert!(!destination.join("escaped.txt").exists());
    Ok(())
}
