# Native Tauri translation through the checked local model

Date: 25 September 2026. This is an opt-in Windows integration test of the actual Auralis desktop executable. It establishes native React → Tauri IPC → Rust → managed model → two SQLite databases → artifact-outbox behavior. It is structural and lifecycle evidence, not a bilingual quality result or a release gate.

## Setup and invocation

- Auralis task: `task desktop:e2e:native:translation` from the Auralis repository root. The task builds the native desktop E2E executable and runs it in an isolated temporary application-data directory.
- Source: a synthetic one-cue Chinese UTF-8 SRT, `1\n00:00:01,000 --> 00:00:02,000\n你好。\n`, created by the test. No third-party subtitle corpus is imported.
- Model: the [checked experimental Hy-MT2 profile](../../models/manifests/hy_mt2_1_8b_q4_k_m.checked.experimental.json), with local GGUF SHA-256 `dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699` and a local `llama-server.exe` reporting build `b10977-0ecb159c9`.
- Runtime configuration: context 2048, 99 requested GPU layers; Windows machine with NVIDIA GeForce RTX 3070 and 8192 MiB VRAM. Peak resource use was not measured.
- Set `AURALIS_TEST_LLAMA_SERVER` and `AURALIS_TEST_GGUF` to absolute paths of those installed, untracked files before running the task. The test generates its own `translation-runtime.json`; no application installation is implied.

## Observed result

The task passed. The React runner created a project, imported and waited for a ready managed original, froze a Chinese → Russian run, invoked `start_translation_run_cmd`, waited for outbox publication, and fetched the selected source/result comparison. The native process reached the `translation-source-ready`, `translation-run-ready`, and `translation-result-ready` checkpoints.

The verifier reopened both SQLite files after the UI scenario. Auralis retained a project link to the translation, cleared the completed active run, selected the exact ready `needs_review` result and output artifact, and closed a completed translation host job. Translate SQLite held a validated run and an immutable result with the same run ID and revision as the Auralis publication. Both source hashes matched the external SRT. The managed original was byte-identical to that source; the translated artifact was a different file, had the Translate result hash, differed from the Chinese source, and retained the original timing line. Both original and output artifact-finalization outbox messages were done. The native app and model child were gone after the test, and the temporary test data was removed.

The normal `task desktop:e2e:native` path also passed after this extension. It still checks its existing media workflow when translation opt-in is disabled. Frontend type checking and linting passed after the E2E change.

## Limits and next checks

This one-cue run confirms a native command path and cross-database publication on one Windows hardware profile. It does not prove translation adequacy, terminology, sustained throughput, installation on a clean machine, long-file behavior, WebVTT inference, or Japanese support. A separate [managed worker-kill test](2026-09-25-managed-worker-crash.md) covers checkpoint recovery through the application services; this native test does not kill and restart the entire desktop process. Complete a native whole-process interruption/restart test and the licensed bilingual protocol before marking S7 or S8 complete.
