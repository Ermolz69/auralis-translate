# Application-data package repair

Date: 26 September 2026. Scope: repair of the single pinned Windows x64 CPU package. It does not implement package upgrades or arbitrary package selection.

## Behavior

Auralis installation now verifies an existing package before treating it as reusable. A corrupt or incomplete package is replaced only after a private candidate has been assembled and checked from the pinned upstream cache/downloads. The previous directory moves to `.previous-cpu` before publishing the replacement; a failed publication attempts restoration. Retrying restores a previous directory when the final path is missing, or removes the previous copy when the final package verifies. The release/backend selection marker survives repair.

The subtitle workspace exposes **Check and repair**. Installation/repair and selection share the selected-runtime write admission lock; both refuse active translation host jobs. A successful repair refreshes an already selected in-memory runtime. Unexpected storage files and non-regular package roots are rejected before network acquisition and are not overwritten.

The reusable Translate `verify_runtime_files` operation additionally checks every extracted runtime entry against the retained, digest-verified archive. It reuses the extractor's flat-name, unique-entry, file-count, and byte-size policy. Missing, same-length changed, or extra runtime files fail verification. The model, notices, and retained archives keep their separate pinned hashes. This is a package-on-disk check, not attestation of a running process.

## Evidence

From Auralis:

```text
task rs:test:translate:package ASSET_DIR=E:\Anything\Projects\Commercial\auralis-translate\.cache\download-smoke
task desktop:e2e:native:translation:package ASSET_DIR=E:\Anything\Projects\Commercial\auralis-translate\.cache\download-smoke
```

The first real cached-package test passed in 723.76 seconds. It installed and selected the pinned package in a temporary directory, changed the installed model's first byte without changing length, observed rejection of selection, simulated interruption by moving the final directory to `.previous-cpu`, repaired it, retained selection, removed the previous copy, and reconstructed the selected runtime after reopening. The shared source cache was not changed.

The expanded final host test passed in **825.41 seconds** after submodule integration. It additionally changed the extracted executable's first byte at the same length, observed `Conflict` from the already selected runtime's acquisition before process start, rejected selection, then corrupted the GGUF and exercised the same recovery/repair/reopen path. Its log is `.cache/package-repair-final.log` in Auralis. An initial async version of this test failed because the synchronous reqwest installer was invoked directly inside a Tokio context; the corrected synchronous test enters a separate runtime only for acquisition, while production installation already uses `spawn_blocking`.

The native task exited 0 and cleaned its isolated application-data sandbox. It exercised React installation/selection, desktop restart, selected CPU runtime reconstruction, and a real one-cue translation through both databases into a separate ready artifact. After the extracted-runtime verifier and pre-acquisition wrapper were integrated, the same native task passed again; the final preserved local log is `.cache/package-native-final.log` in Auralis. An earlier run whose terminal output was lost is not counted as passing evidence.

The installed-package runtime wrapper verifies the retained archive and extracted runtime files in a blocking worker on every acquisition, before the managed runtime checks the model and launches the process. This also catches on-disk damage after package selection. The host starts without synchronously hashing the full model on the UI thread.

From Translate, `task lint` and `task test` passed. A new public-behavior test installs a tiny synthetic archive, verifies it, rejects a same-length changed executable, then rejects an extra undeclared DLL. The archive path-escape and offline-install regressions also remain green.

From Auralis, `task rs:clippy`, `task rs:test:translate`, `task fe:lint`, `task q:format-check`, `task q:ipc-contract`, and `task check:docs` passed. `task fe:test:components -- src/features/translation-model-setup/ui/TranslationModelSetup.test.tsx` passed three UI tests, including selected-package repair. The default package tests now live under the adapter crate's `tests/` directory. Production frontend, exclusion policy, default dependency graph, and optimized executable checks are recorded in [the delivery audit](2026-09-26-translation-delivery-audit.md). Translate `task docs:check` validates active local file links; external URLs and anchors are outside that check.

## Limits

Only one named swap boundary is simulated; this is not a full process-kill/power-loss matrix. A hard kill can leave a private `.repair-*` workspace, and orphan cleanup remains open. Parent-directory metadata power-loss durability is not claimed. Real-CDN interruptions, a clean offline machine, upgrades/coexistence, rollback between distinct releases, and removal are separate gates. No linguistic-quality gate is closed by package repair.
