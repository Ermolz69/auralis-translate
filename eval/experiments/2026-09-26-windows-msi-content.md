# Fresh Windows MSI payload audit

Date: 26 September 2026. Scope: a real locally built, unsigned Windows x64 MSI with production features and materialized content verification. This adds S6/S8 delivery evidence; clean installation, signing and language gates remain open.

This is the earlier build record. The [later cancellation build](2026-09-26-windows-msi-cancellation.md)
supersedes its live `target/` paths; the copies under the retained audit directory
below remain the authoritative artifacts for the hashes in this record.

## Commands and outcomes

From the Auralis checkout:

```text
task desktop:bundle -- --bundles msi
task desktop:bundle:from-build -- --bundles msi
task media:check
task q:release-metadata
task release:smoke:check
```

The final ordinary bundle task completed an optimized Rust build in 4 minutes 55 seconds, produced a fresh MSI and passed the extracted payload audit. The repackage task then passed using that same executable and frontend, including another pre-bundle capture and content audit. It verifies prepared media tools before packaging and does not compile changed production source. The production frontend build passed its budget and translation-delivery checks: 16 emitted files, no emitted test modules or weight/evaluation payloads, and bounded native resources.

`task media:check` passes six manifest/repository/staging tests and three packaged-application behavior tests. They cover missing/duplicate/modified executables, stale source identity, complete post-signing bytes, a failed signer, misleading marker-like constants, an absent capture and source changes before signing. The signature append fixture checks full-byte capture; it is not a real signing certificate or a trust verdict. `task q:release-metadata` passed four tests and synchronized metadata. `task release:smoke:check` passed 11 installer/asset/signing/tag tooling tests; it does not execute installation.

All model/runtime asset caches used by earlier inference remain outside the MSI. This task used the already verified media-tool cache. No translation model or corpus was downloaded, installed into the app package or uploaded. No official release was created or pushed.

## Exact artifacts

| Artifact | Bytes | SHA-256 |
| --- | --- | --- |
| Final full-build MSI | 67,747,840 | `5133163be6a3f22786a06fd4d34189bdf77967731f40b6fac39106185d2535c2` |
| Final repackage MSI | 67,751,936 | `5d565e448b8252e966e496770661bed358ecd343a1326a157f69e75ed12b54ec` |
| Current restored release executable | 17,732,096 | `e26f8f30cfd42035e3fe9e55e86eb15fab04f90548d16fb140691ea678ffc4cd` |
| Application extracted from either successful MSI | 17,732,096 | `a0ae6a5173047fb3939a20d7e26b00b34b20fb5aea6b6aef872245def51a2271` |

The application bytes match between the two successful packages. MSI bytes differ across packaging invocations; this is not a reproducible-build claim. The current file is `auralis/target/release/bundle/msi/Auralis_0.1.0_x64_en-US.msi`. The audit report is `auralis/target/bundle-verification.json`, and source/package digest captures are under `auralis/target/release/bundle-application-digests/`. All are ignored local build artifacts.

The final MSI and exact JSON records are retained in Auralis `.cache/installer-audits/verified-bef2a7f69dd5405a9f044fdc6d1afec8/`; the copied installer passed the report's digest. Windows reports `NotSigned` for that copy. Auralis now explicitly ignores root `.cache/`, and `git check-ignore` confirms the diagnostic cache, audit report and source capture are excluded. The build directories and caches are outside production resources and publication allowlists.

The extracted tree contains nine regular files, including the administrative extraction's copy of the MSI. Installed payload files are:

- `PFiles/Auralis/auralis-app.exe`.
- `PFiles/Auralis/binaries/ffmpeg-x86_64-pc-windows-msvc.exe`.
- `PFiles/Auralis/binaries/ffprobe-x86_64-pc-windows-msvc.exe`.
- `PFiles/Auralis/binaries/yt-dlp-x86_64-pc-windows-msvc.exe`.
- `PFiles/Auralis/binaries/FFMPEG-GPL-3.0.txt`.
- `PFiles/Auralis/binaries/YT-DLP-UNLICENSE.txt`.
- `PFiles/Auralis/binaries/THIRD-PARTY-NOTICES.txt`.
- `PFiles/Auralis/binaries/media-tools-provenance.json`.

Every media executable/license passed its pinned digest or exact generated-text comparison; the media directory contains only its allowlisted files. The entire extracted tree passed weight/test-data path rejection. The production frontend is embedded in the verified application executable and was checked separately before compilation. There are no loose model, evaluation, Node/Rust test-runner or SQLite test-state files in this observed payload.

## Failed checks and correction

An initial ordinary build produced a fresh MSI but its added raw application-hash comparison failed. Read-only comparison found exactly three differing bytes: the package marker was `MSI` while the restored release executable had `UNK`. The [pinned Tauri 2.11.4 bundler source](https://github.com/tauri-apps/tauri/blob/tauri-cli-v2.11.4/crates/tauri-bundler/src/bundle.rs) patches the package type, signs/packages the application and restores its original binary afterward. A direct raw-hash equality check therefore represented the wrong contract.

The first repackage investigation also failed because the binary contains other marker-like string constants; locating a unique marker prefix after patching was ambiguous. The final implementation captures the unique unpatched variable's offset and whole-file digest through `task desktop:before-bundle`. Before signing, the wrapper reverses only that captured marker in a memory copy and requires all source bytes to reproduce the frozen digest. After the signing callback succeeds, it records the full actual package executable's length and digest. Extraction requires exactly one application matching that record, and the source record must still match the current restored executable. No checksum, certificate, header or arbitrary payload region is ignored.

Actual signature trust remains a separate production check. The observed local signing wrapper explicitly skipped signing, and no signing credentials were used. Failures remain part of this investigation, rather than being relabeled successful builds. A diagnostic extraction from the first failed audit remains under ignored `.cache/installer-audits/`.

## Limits and remaining gate

Administrative extraction reads package files in an owned temporary directory; the verifier cleans that directory afterward. It does not run setup actions, launch the application against existing user data, test uninstallation or prove WebView2 acquisition on a clean system. This record covers MSI on the current Windows development machine; NSIS, signed packages and other platforms need their own actual evidence.

The [clean Windows protocol](../../docs/evaluation/006-clean-windows-installation.md) defines unseeded application/model installation, interrupted transfer, network-disconnected cold launch and real translation, notices/disk/resource measurements and recovery. G9 remains open until those steps pass on a declared clean OS/backend profile. Bilingual subtitle review and the language gates are independent of this payload audit.
