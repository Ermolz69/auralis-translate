# Windows MSI after request cancellation and separate QA handoff

Date: 26 September 2026. Scope: fresh production MSI compilation, materialized
payload verification and independent authored clean-Windows test inputs. No
application installation, model download, bilingual review or public upload was
performed in this slice.

## Build identity and observed package

The Auralis checkout was clean at build start, at
`0695d55029366a152136f1faf9160c03456649e8`, with Translate pinned to
`2897b1c7a6d3bccef64a9b242a244ef17c1c5bbb`. This includes the control-aware HTTP
transport, disabled idle connection pooling, desktop pause/resume and the worker's
typed cancellation completion correction. Later documentation/QA-tool changes do
not change these captured executable bytes.

From Auralis, `task desktop:bundle -- --bundles msi` passed. The optimized Rust
compilation took 5 minutes 34 seconds. The frontend budget and delivery checks
passed for 16 emitted files. Pre-bundle capture, package-marker patching, whole
packaged-application identity and administrative extraction verification passed.
The temporary extraction was cleaned. Cached pinned media assets were reused.

| Artifact | Bytes | SHA-256 |
| --- | --- | --- |
| Fresh MSI | 67,743,744 | `c702e1b9ee3b06ebe891f8c7221bbc22265c8ee070b234fb455aa610bb5ee007` |
| Restored release application | 17,717,248 | `0c0adf6185e738effb3c882bf38e42cbe619345294f024a0365db973033c8ed6` |
| Application inside MSI | 17,717,248 | `4a6a00ea0795a036eedee5068452c2a79c6547ff565cd7919a89a1071d1ae8b6` |
| Retained bundle audit JSON | 1,158 | `45b2531e536b8452fee7c9b259eb60c7ec75f4d0dc4725bec5ed0dfe4ec22a53` |

The retained installer and source/package digest captures are in Auralis's ignored
`.cache/installer-audits/cancellation-2026-09-26-1200/`. The live build path is
`target/release/bundle/msi/Auralis_0.1.0_x64_en-US.msi`; future builds may overwrite
it. The retained copy reproduces the audited hash. PowerShell's Authenticode
query reports that it is not digitally signed. The local signing callback
explicitly skipped signing; upstream media signature diagnostics did not become
a signature-trust verdict. No official release or GitHub publication was made.

The nine extracted regular files are the MSI administrative copy, the application,
three pinned media executables, two license files, notices and provenance. The
media directory contains only its allowlist. No model weights, test corpus,
SQLite test state or Node/Rust runner were found. The embedded production frontend
was separately checked for emitted test modules and evaluation payloads.

## Independent clean-Windows QA inputs

The new [setup fixture](../fixtures/clean-windows/setup-probe.v1.json) contains four
project-authored Chinese cues and unreviewed Russian drafts. It exercises time,
negation, quantity and deadline diagnostics. Generated SRT and WebVTT use UTF-8
BOM, CRLF, explicit cue labels and the same artificial timings.

From Translate, the following command passed with the full build revisions above:

```text
task eval:clean-windows:prepare AURALIS_ROOT=E:/Anything/Projects/Commercial/auralis OUTPUT_DIR=E:/Anything/Projects/Commercial/auralis-translate/.cache/clean-windows-qa/cancellation-2026-09-26-1200 AURALIS_REVISION=0695d55029366a152136f1faf9160c03456649e8 TRANSLATE_REVISION=2897b1c7a6d3bccef64a9b242a244ef17c1c5bbb
task inspect -- .cache/clean-windows-qa/cancellation-2026-09-26-1200/setup-probe.srt
task cli -- inspect-vtt .cache/clean-windows-qa/cancellation-2026-09-26-1200/setup-probe.vtt
```

Preparation validates the actual MSI length/hash and the current restored
application against its completed audit before copying. The new directory has
eight files: installer, audit, two subtitle sources, draft reference, a detached
checklist, empty report and input hash manifest. It includes no model/runtime
assets, controller executables or application databases. Both real format
inspectors accepted exactly four cues and exposed the expected protected ranges.

| QA input | Bytes | SHA-256 |
| --- | --- | --- |
| SRT | 271 | `de571ad24625f29a7a2e7d8175e20d923ea87ad605db12e16421ee90fc8b7b5f` |
| WebVTT | 281 | `1dea0406d932a42307bd15f4f437782f6b6983eda4904e846927658120b9fb08` |
| Draft reference | 1,149 | `832b81ee77beb276448f602fdeaada9e8ac339fb355c6e98726ed38dd1a0e3f0` |

`task eval:clean-windows:check` passed four tooling tests: allowlisted copied files
and unexecuted report state; installer modification and stale application
rejection; path escape, application-directory output, missing audit and abbreviated
revision rejection; invalid plain cue rejection. It also verifies source-only
subtitle text, retained file hashes and refusal to overwrite a QA directory.
The first sandboxed invocation failed to spawn Node's worker with `EPERM`; the
same task passed with local execution permitted. These tests use fake installer
bytes; actual installer evidence comes from the separate bundle task above.

The handoff directory is ignored by Git. It remains separate from application
resources and publication inputs. `REPORT.json` is still `not_executed`, with all
nine steps `not_run`, signature `not_verified` and language review `not_reviewed`.
The independently observed development MSI signature status above does not fill
in a future clean-environment report.

## Remaining evidence

This closes the fresh-MSI payload check for the cancellation source revisions.
The [clean Windows protocol](../../docs/evaluation/006-clean-windows-installation.md)
still needs a disposable unseeded Windows environment, real explicit model setup,
interrupted transfer and network-disconnected cold translation. Package lifecycle,
signed delivery, target-player exports and source-aware language review remain
open. Preparing diagnostic input or extracting an installer does not close G9.
