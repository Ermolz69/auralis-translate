# Translation weights and test-data delivery audit

Date: 26 September 2026. Scope: production frontend output, native resource wiring, dependency features, and publication selection. No signed installer or clean-machine release claim is made.

## Verified boundaries

| Boundary | Command/evidence | Observed outcome |
| --- | --- | --- |
| Production frontend | Auralis `task fe:build` | Passed build/budget checks; inspected 16 emitted files and bundle module report; no emitted test modules, GGUF/other weight files, or test/evaluation payloads. |
| Native resources | Auralis `tools/translation-delivery/check.mjs` inside `task fe:build` | Tauri resources use bounded `binaries/` media-tool paths; no Translate model/data directory is selected. |
| Negative policy checks | Auralis `task q:translation-delivery` | Eight tests passed, including rejection of weights/test payloads, emitted test code, unbounded resource globs, and exclusion of sidecar GGUF/reports from release publication. |
| Default native dependency graph | Auralis `task rs:tree -- -p auralis-app -e features` | No `native-e2e` feature and no evaluation crate in the default application dependency graph. |
| Production executable | Auralis `task rs:build:release` | Passed an optimized build without the native test feature; `target/release/auralis-app.exe` is 17,555,968 bytes, SHA-256 `04b197435b40f837cb1584d694424da7e8a43e761bbf6ec4c09cb7a4d0e4804f`. This is the application executable, not a signed installer or a model package. |
| Materialized native bundle | New policy inside Auralis `task media:bundle:verify` | Weight/test path rejection is wired into extraction verification. A newly built installer has not yet been checked through this path. |
| Actual upstream package | [Native CPU package installation](2026-09-26-native-package-translation.md) and [repair](2026-09-26-package-repair.md) | Explicit installation/selection acts on application-data files, independent of installer resources. Native test seeds a pinned cache; separate downloader evidence covers actual upstream acquisition. |

The Auralis release workflow uploads only named platform installers/updater signatures. `prepareReleaseAssets` then copies its explicit installer/signature allowlist plus generated updater metadata/checksums into `release-publish/`; the publication regression verifies that an extra upstream GGUF and local report never enter that directory. No application source or test task uploads model weights.

## Local data

The [ten-row comparison](2026-09-26-flores-file-comparison.md) retains full source/reference/candidate texts, source/output files, SQLite state, notices, and logs under ignored `.cache/eval/file-runs/`. The corpus archive and GGUF/runtime caches also remain ignored. Their development scripts and manifests do not make them runtime dependencies or bundle resources. Production checks run separately from native E2E builds, which use `dist-native-e2e` and the opt-in Rust feature.

The owner asked to keep publication local for now. GitHub authentication is available, but no public Translate remote was created or pushed. A local reachable-history pattern audit read 819 blob objects and 98 commits at `1a9d43e`, finding no recognized credential patterns or binary blobs; its full report remains ignored. This audit is not proof of absence of arbitrary secrets or personal information and is not a release/quality gate.

## Remaining evidence

A later [fresh Windows MSI audit](2026-09-26-windows-msi-content.md) now passes materialized payload and application-identity checks. Execute [clean target Windows setup](../../docs/evaluation/006-clean-windows-installation.md), explicit upstream model installation, offline translation, notices, disk use and recovery. Verify the intended signed package formats and preserve separate CPU/GPU platform claims. Development-machine content checks do not close G9 or establish translation quality.
