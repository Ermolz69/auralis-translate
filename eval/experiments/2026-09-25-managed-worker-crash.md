# Managed model worker crash and resume

Date: 25 September 2026. This is an opt-in Windows application-integration test of a checked local model, its host-owned process, two SQLite databases, and separate artifact publication. It is not a native Tauri UI test or a language-quality assessment.

## Setup

- Auralis test: `crates/application/tests/translation_managed_crash_real.rs` at the Auralis checkout.
- Source: a synthetic two-cue UTF-8 Chinese SRT created inside the test's temporary directory. Each cue is one model block; no third-party subtitles are stored.
- Model: the [checked experimental Hy-MT2 profile](../../models/manifests/hy_mt2_1_8b_q4_k_m.checked.experimental.json), with `target_segments_per_block` set to `1` for this test. The pinned GGUF revision is `a0c709d9fac510f2c807aa3af52872340dc37a4a`, SHA-256 is `dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699`, and size is 1,133,080,448 bytes.
- Runtime: local `llama-server.exe`, reported build `b10977-0ecb159c9`, context 2048 and 99 requested GPU layers. The test machine exposed an NVIDIA GeForce RTX 3070 with 8192 MiB VRAM. CPU and peak RAM/VRAM were not measured.
- Host: Windows. The test created a fresh Auralis SQLite file, a fresh Translate SQLite file, and a temporary managed-artifact store.

## Invocation

The paths point to installed local test assets excluded from Git. From the Auralis repository root:

```powershell
$env:AURALIS_TEST_LLAMA_SERVER = 'E:\Anything\Projects\Commercial\auralis-translate\.cache\runtime\llama\llama-server.exe'
$env:AURALIS_TEST_GGUF = 'E:\Anything\Projects\Commercial\auralis-translate\.cache\models\Hy-MT2-1.8B-Q4_K_M.gguf'
task rs:test:application -- --test translation_managed_crash_real -- --ignored --exact killed_managed_worker_releases_model_and_resumes_remaining_block --nocapture
```

The test passed: `1 passed`, elapsed time 471.70 seconds. This is total test time with model startup, inference and recovery, not a throughput benchmark.

## Observed sequence

1. The parent froze a project-linked run against the managed original. A child test process acquired a checked managed runtime lease, started `llama-server`, and began the host translation job.
2. The parent waited for exactly one durable Translate checkpoint while the run was still `running`. It then killed the worker process. The first loopback model endpoint stopped accepting connections; the observed first server PID was 4072 and it was absent after the kill.
3. The parent reopened both databases. Scoped host-job recovery returned one successful recovery item and an empty result on the second call, closed the old active job, retained the project link to the unfinished run, and left exactly one committed checkpoint in a paused run. No result was selected at that point.
4. A new managed runtime process resumed that same run, completed the remaining block, and created a pending publication. The observed second server PID was 16216. The Auralis outbox finalized a separate ready translated artifact and selected its result.
5. The output retained both original timing lines and differed from the source. The external source file still matched its original bytes. After test completion, no `llama-server` process remained.

The test is ignored in default CI because it needs the pinned local executable, GGUF and suitable hardware. Its assertions cover process cleanup, durable checkpoint count, project/run linkage, recovery idempotence, publication readiness and source immutability. It does not score the Russian text.

## Remaining verification

The test composes the same application services used by the desktop command but does not invoke the Tauri command or React UI. Native desktop startup after a whole-app crash, failure after Translate result commit but before outbox finalization, mid-request pause/cancellation, concurrent starts, model installation and resource measurements still need evidence. A bilingual reviewer and licensed holdout remain necessary for Chinese and Japanese language gates.
