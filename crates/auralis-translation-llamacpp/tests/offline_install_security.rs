use auralis_translation_llamacpp::install_offline;
use std::error::Error;
use std::fs::{self, File};
use std::io::{self, Read};
use std::path::Path;
use zip::write::SimpleFileOptions;
use zip::{ZipArchive, ZipWriter};

#[path = "support/offline_install_fixture.rs"]
mod offline_install_fixture;
use offline_install_fixture::{Fixture, fixture_with_archive, make_zip};

fn assert_rejected(root: &Path, fixture: &Fixture) -> Result<(), Box<dyn Error>> {
    let destination = root.join("installed");
    assert!(
        install_offline(
            &fixture.manifest,
            &fixture.profile,
            "cpu",
            &fixture.sources,
            &destination,
        )
        .is_err()
    );
    let release = destination.join("hy-mt2-1-8b-q4-windows-x64-cpu-b10977");
    assert!(!release.join("cpu").exists());
    assert!(fs::read_dir(release)?.next().is_none());
    Ok(())
}

fn central_header(bytes: &[u8]) -> Result<usize, io::Error> {
    bytes
        .windows(4)
        .position(|window| window == b"PK\x01\x02")
        .ok_or_else(|| io::Error::other("fixture central header is missing"))
}

#[test]
fn archive_paths_never_escape_or_publish_a_package() -> Result<(), Box<dyn Error>> {
    for name in [
        "../outside.txt",
        "..\\outside.txt",
        "/outside.txt",
        "C:/outside.txt",
        "runtime/llama-server.exe",
        "llama-server.exe:stream",
    ] {
        let root = tempfile::tempdir()?;
        let outside = root.path().join("outside.txt");
        fs::write(&outside, b"external sentinel")?;
        let fixture = fixture_with_archive(root.path(), |archive| make_zip(archive, name))?;
        assert_rejected(root.path(), &fixture)?;
        assert_eq!(fs::read(outside)?, b"external sentinel");
    }
    Ok(())
}

#[test]
fn privileged_permissions_and_special_entries_never_publish_a_package() -> Result<(), Box<dyn Error>>
{
    for mode in [
        0o104755_u32,
        0o102755,
        0o101755,
        0o120777,
        0o010600,
        0o020600,
        0o060600,
        0o140600,
        0o040755,
    ] {
        let root = tempfile::tempdir()?;
        let fixture = fixture_with_archive(root.path(), |archive| {
            make_zip(archive, "llama-server.exe")?;
            let mut bytes = fs::read(archive)?;
            let header = central_header(&bytes)?;
            bytes[header + 5] = 3;
            bytes[header + 38..header + 42].copy_from_slice(&(mode << 16).to_le_bytes());
            fs::write(archive, bytes)?;
            let mut zip = ZipArchive::new(File::open(archive)?)?;
            let entry = zip.by_index(0)?;
            assert_eq!(entry.external_attributes() >> 16, mode);
            assert_eq!(entry.unix_mode(), Some(mode & !0o7000));
            Ok(())
        })?;
        assert_rejected(root.path(), &fixture)?;
    }
    Ok(())
}

#[test]
fn escaping_symlink_cannot_change_external_contents_or_permissions() -> Result<(), Box<dyn Error>> {
    for absolute in [false, true] {
        let root = tempfile::tempdir()?;
        let outside = root.path().join("outside.txt");
        fs::write(&outside, b"external sentinel")?;
        let permissions = fs::metadata(&outside)?.permissions();
        let target = if absolute {
            outside.to_string_lossy().into_owned()
        } else {
            "../../../outside.txt".into()
        };
        let fixture = fixture_with_archive(root.path(), |archive| {
            let mut writer = ZipWriter::new(File::create(archive)?);
            writer.add_symlink("llama-server.exe", &target, SimpleFileOptions::default())?;
            writer.finish()?;
            Ok(())
        })?;
        assert_rejected(root.path(), &fixture)?;
        assert_eq!(fs::read(&outside)?, b"external sentinel");
        assert_eq!(fs::metadata(outside)?.permissions(), permissions);
    }
    Ok(())
}

#[test]
fn incomplete_or_corrupt_archive_never_publishes_or_leaves_staging() -> Result<(), Box<dyn Error>> {
    for fault in ["truncated", "crc", "missing-executable"] {
        let root = tempfile::tempdir()?;
        let fixture = fixture_with_archive(root.path(), |archive| {
            make_zip(
                archive,
                if fault == "missing-executable" {
                    "library.dll"
                } else {
                    "llama-server.exe"
                },
            )?;
            let mut bytes = fs::read(archive)?;
            match fault {
                "truncated" => bytes.truncate(bytes.len() - 22),
                "crc" => {
                    let header = central_header(&bytes)?;
                    bytes[header + 16] ^= 0xff;
                }
                _ => {}
            }
            fs::write(archive, bytes)?;
            if fault == "crc" {
                let mut zip = ZipArchive::new(File::open(archive)?)?;
                assert!(zip.by_index(0)?.read_to_end(&mut Vec::new()).is_err());
            }
            Ok(())
        })?;
        assert_rejected(root.path(), &fixture)?;
    }
    Ok(())
}

#[test]
fn interrupted_asset_copy_never_publishes_or_leaves_staging() -> Result<(), Box<dyn Error>> {
    let root = tempfile::tempdir()?;
    let fixture =
        fixture_with_archive(root.path(), |archive| make_zip(archive, "llama-server.exe"))?;
    fs::remove_file(fixture.sources.join("LLAMA-LICENSE.txt"))?;
    assert_rejected(root.path(), &fixture)?;
    Ok(())
}
