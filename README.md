# Auralis Translate

An independent Rust engine for translating existing subtitle files into separate Russian copies. Auralis provides project storage, desktop controls, model lifecycle, and result selection; Translate owns parsing, translation contracts, checkpoints, edits, and immutable results in its own SQLite database.

The current implementation is **experimental**. Strict plain-SRT and a documented plain-WebVTT subset have real-model and recovery evidence. Language quality, clean-machine packaging, long-file performance, and the Chinese/Japanese release gates remain open. See [implementation status](docs/IMPLEMENTATION_STATUS.md).

## Start here

- [Documentation index](docs/README.md)
- [Current English product plan](docs/PRODUCT_PLAN.md)
- [Temporary implementation stages](docs/IMPLEMENTATION_STAGES.md)
- [Rust architecture](docs/architecture/004-rust-code-architecture.md)
- [CLI machine protocol v1](docs/reference/cli-protocol-v1.md)
- [Agent instructions](AGENTS.md)

The Russian [historical plan](AURALIS_SUBTITLE_TRANSLATION_PLAN.md) stays at the root. Later agreed file-based MVP decisions are recorded in English under `docs/`.

## Local checks and commands

Use the pinned Rust toolchain in `rust-toolchain.toml` and Task. After dependencies are available:

```text
task build
task check
task docs:check
task cli -- inspect PATH_TO_SOURCE.srt
task cli -- inspect-vtt PATH_TO_SOURCE.vtt
```

`task check` covers Rust formatting, Clippy, and workspace tests. The documentation link check and optional evaluation scripts use Node.js. Default Rust tests use small synthetic fixtures and mock providers; they do not establish translation quality.

The CLI accepts an explicitly installed checked local server for `translate`, `translate-vtt`, and `resume`. See [implementation status](docs/IMPLEMENTATION_STATUS.md) for exact command contracts and [the ten-row comparison record](eval/experiments/2026-09-26-flores-file-comparison.md) for a reproducible real local file transport run and source/reference/candidate reports.

`task eval:cli:flores:profiles` compares frozen decoding/prompt variants with supplied local assets. The [real comparison evidence](eval/experiments/2026-09-26-profile-comparison.md) records passing transport checks and unresolved translation defects. Complete comparison reports stay in ignored local storage; evaluation does not download weights or select a production profile automatically.

`task eval:cli:long:interruption` runs optimized CLI recovery checks on authored 1024-cue SRT and WebVTT files with supplied assets. The [long-file record](eval/experiments/2026-09-26-long-file-recovery.md) verifies interruption, exact checkpoint retention and offline re-export, and records sampled memory before and after an explicit runtime-cache setting. This technical probe does not establish subtitle adequacy or a throughput SLA.

## Model and test-data delivery

Third-party model weights are never embedded in the application or uploaded to our release. Auralis downloads pinned upstream assets only after the user's **Download and install** action and selects a package after verification. The standalone CLI also supports explicit `fetch-release`, `install-online`, and separately supplied assets through `install-offline`; see [model installation](docs/architecture/007-model-installation.md).

Local GGUF/runtime caches, external corpora, generated comparison fixtures, reports, and SQLite test state stay under ignored `.cache/` or isolated temporary directories. They do not enter production bundles. [Delivery evidence](eval/experiments/2026-09-26-translation-delivery-audit.md) distinguishes verified development checks from remaining clean-machine gates. Preserve the upstream model/runtime license notices independently of source-code licensing.

## Auralis integration

Auralis pins this repository at `modules/auralis-translate` as a Git submodule and uses Cargo path dependencies. Translate SQLite owns translation details; Auralis SQLite stores project links and ready artifact selection. Original subtitles stay immutable, and partial results are not published. See [integration](docs/architecture/003-auralis-integration.md) and [storage lifecycle](docs/architecture/002-storage-and-lifecycle.md).

Public GitHub publication is deferred by the owner. The current integration is local; no public remote was created or pushed.
