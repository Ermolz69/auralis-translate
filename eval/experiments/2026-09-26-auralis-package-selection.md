# Auralis application-data package installation and selection

Date: 26 September 2026. Scope: the pinned experimental Windows x64 CPU package on the development machine. This records the Auralis adapter path; it is not a clean-machine or language-quality release gate.

## Implemented boundary

The Auralis Translate adapter embeds the pinned release manifest and checked profile from its Translate submodule. It downloads into an application-data cache, installs a versioned package under application data, and verifies the frozen manifest, profile, model, two notices, and upstream runtime archive before selection. Auralis persists only release ID and backend in a bounded selection marker. On restart it reconstructs the selected runtime from the application-data package; at model admission the existing managed runtime verifies the frozen profile, model digest, and reported server identity. Desktop commands expose package status, installation, and selection without accepting a URL or filesystem path from the UI. Selection refuses to replace the runtime while an Auralis translation host job is active. The older manual runtime JSON remains a development fallback when no package has been selected.

The Windows submodule checkout initially converted the checked JSON profile from LF to CRLF. Its SHA-256 became `2485c6352908c0df2d7c22f77f6d232fd85e25c8c6811d39c127ee87499462dc`, so the release manifest rejected it. The Translate `.gitattributes` now fixes JSON checkout endings to LF. After rewriting the stale local checkout, the profile again matched the pinned SHA-256 `dba1d341230bc4f1117c6fba8ce55a1127b120864aa8363295bdbc883b98fc3e`. The local release JSON was also rewritten under the new rule so persisted package metadata remains byte-identical across later checkouts. A fresh clone will use the attribute from its first checkout.

## Observed checks

- `task rs:test:translate` passed the adapter tests, including rejection of a missing package and a changed selection marker.
- `task rs:clippy` passed with warnings denied across all Auralis workspace targets. `task rs:test:desktop` passed 63 Tauri tests after the package commands were registered.
- `task rs:test:translate:package ASSET_DIR=ABSOLUTE_CACHE_DIR` passed using the complete official cache documented in [the network acquisition record](2026-09-25-resumable-download.md). The ignored test performed Auralis adapter installation into a temporary application-data root, verified the package, selected it, reopened the package service, and observed both `installed` and `selected` plus an available reconstructed runtime. The test completed in 395.11 seconds. It did not contact the network because every pinned cache entry was already complete.
- The frontend package UI and IPC contracts passed the Auralis `task fe:typecheck`, `task fe:lint`, `task fe:test:unit`, `task fe:test:components`, and `task q:ipc-contract` checks during this implementation. The component test covers install, select, and an active-job refusal message.

## Limits

This test does not click the package buttons in a native Tauri window, start the newly installed CPU executable, translate a subtitle using that installed path, measure CPU performance, or verify a clean offline Windows machine. Upgrade, repair, rollback and removal with active-run protection remain open. The UI currently shows one busy state for the whole download and verification operation, without byte-level progress.
