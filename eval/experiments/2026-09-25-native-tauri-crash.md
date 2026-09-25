# Native Tauri process interruption and translation resume

Date: 25 September 2026. This opt-in Windows test exercises a whole Auralis desktop process termination after one durable model checkpoint, followed by a fresh desktop launch against the same two SQLite files and managed artifacts. It extends the [native checked-model translation path](2026-09-25-native-tauri-translation.md).

## Setup

- Auralis task: `task desktop:e2e:native:translation:crash`. Set absolute `AURALIS_TEST_LLAMA_SERVER` and `AURALIS_TEST_GGUF` paths to the installed checked assets before invoking it. The task builds and launches the actual React/Tauri executable in a temporary application-data root.
- Source: a synthetic two-cue Chinese SRT created by the test. Each cue is one block. The test-only `native-e2e` command path changes `target_segments_per_block` to 1 in the otherwise checked experimental Hy-MT2 profile; the frozen profile and its fingerprint stay the same on restart. Production builds do not include this override.
- Model and runtime: the same pinned Hy-MT2 1.8B Q4_K_M GGUF and `llama-server` build as the native translation test, with 2048 context tokens and 99 requested GPU layers. The machine exposed an NVIDIA GeForce RTX 3070 with 8192 MiB VRAM. Peak CPU, RAM and VRAM were not measured.

## Observed sequence

1. React created a project, imported the source as a ready managed original, and froze a Chinese → Russian run. Auralis SQLite linked the active run to the project; Translate SQLite stored its source and plan.
2. The first native process started a managed checked-model attempt. The harness waited for exactly one committed `block_checkpoints` row while the Translate run was still `running`, then abruptly terminated only the desktop process. The runtime's Windows Job Object must release the managed model child after that parent exits.
3. Before restart, the harness reopened both SQLite files and verified the project still referenced the same unfinished translation/run, the run was still `running`, and the first checkpoint still existed with the same accepted payload and input fingerprint.
4. A new instance of the same desktop executable bootstrapped against the same application-data directory. Startup recovered the interrupted host association; React found the active project run and started a second managed attempt. The completed output contained both cues, retained their timing, and was published as a separate ready artifact with `needs_review`.
5. After completion, the harness checked two Translate attempts and two host jobs for the same run, exactly two committed blocks, unchanged first-checkpoint payload and commit time, a completed and closed second host job, matching result identity/revision in both databases, two finalized artifact outbox messages, and a byte-identical managed original. The temporary data and native/model processes were cleaned up.

The task passed with the installed checked model. The existing non-crash native task remains a separate one-cue command-path check.

## Limits

The test kills the desktop parent process and checks that its managed model child exits. It does not test a machine power loss, concurrent desktop instances, mid-request user cancellation, an installer, long files, WebVTT inference, or bilingual translation quality. Application-level tests separately cover a worker-process kill and a result-commit/publication gap. These boundaries and clean installation remain open before closing S7/S8.
