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

The native task exited 0 and cleaned its isolated application-data sandbox. It exercised React installation/selection, desktop restart, selected CPU runtime reconstruction, and a real one-cue translation through both databases into a separate ready artifact. A preserved local log is `.cache/package-native-repair.log` in Auralis. An earlier run whose terminal output was lost is not counted as passing evidence. This native run preceded the added extracted-runtime hash check; that extension has library regression evidence and requires a host regression after submodule update.

From Translate, `task lint` and `task test` passed. A new public-behavior test installs a tiny synthetic archive, verifies it, rejects a same-length changed executable, then rejects an extra undeclared DLL. The archive path-escape and offline-install regressions also remain green.

## Limits

Only one named swap boundary is simulated; this is not a full process-kill/power-loss matrix. A hard kill can leave a private `.repair-*` workspace, and orphan cleanup remains open. Parent-directory metadata power-loss durability is not claimed. Real-CDN interruptions, a clean offline machine, upgrades/coexistence, rollback between distinct releases, and removal are separate gates. No linguistic-quality gate is closed by package repair.
