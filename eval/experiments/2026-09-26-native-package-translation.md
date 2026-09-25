# Native Auralis installation and translation from the pinned CPU package

Date: 26 September 2026. Scope: one synthetic Chinese SRT cue, the experimental Windows x64 CPU package, and the development machine. This is native installation and execution evidence, not a clean-machine, performance, or linguistic release gate.

## Procedure

From the Auralis repository, run `task desktop:e2e:native:translation:package ASSET_DIR=ABSOLUTE_CACHE_DIR` with the complete official asset cache recorded in the [acquisition experiment](2026-09-25-resumable-download.md). The native harness creates an isolated application-data root, copies only the four release-declared files into its download cache, and leaves `translation-runtime.json` absent. The package service rehashes the cache and installs the release under its versioned application-data path.

The React runner mounts the actual package setup component in the Tauri WebView, clicks **Download and install** and **Select model**, and waits for the selected state. The harness checks the release/backend selection marker and package files, stops the desktop, and launches it again with the same data root. After restart, the runner sees the selected state and starts the existing one-cue translation workflow. The existing verifier checks the host and Translate SQLite records, completed host job, validated `needs_review` result, separate ready output artifact, unchanged external and managed originals, source mapping, timing, and output digest. No manual runtime configuration can supply the model for this run.

## Observed result

`task desktop:e2e:native:translation:package ASSET_DIR=E:\Anything\Projects\Commercial\auralis-translate\.cache\download-smoke` passed on Windows x64. The command reported that React installed and selected the pinned CPU package, desktop restart restored it, and real subtitle translation published a separate output. Its isolated sandbox was removed. The pinned model file was 1,133,080,448 bytes, and the package used llama.cpp b10977's CPU archive.

The changed Auralis workspace also passed `task fe:typecheck`, `task fe:lint`, `task q:format-check`, and `task rs:clippy`. The native harness scripts passed `node --check tools/native-e2e/run.mjs` and `node --check tools/native-e2e/package-install.mjs`.

## Limits

The source cache was prefilled from complete, previously verified official assets, so this run does not exercise network download or resume. It uses one short synthetic cue and does not measure throughput, cold start, peak RAM, long-file behavior, Russian adequacy, or another Windows installation. The CPU package is still experimental. Clean offline installation, selected-backend policy, repair, upgrade, rollback, removal, and S5/S8 language gates remain open.
