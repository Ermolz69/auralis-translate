# Implementation status and evidence

Status: 24 September 2026. This log reports observed behavior, not release claims. Strict plain-SRT inspection and manual replacement work. A real model has produced a separate Russian SRT through both the experimental path and the durable CLI. Translate SQLite stores run attempts, accepted checkpoints, and immutable results. A CLI test covers managed-source copying, model failure, restart, completion, and reconstruction against a mock HTTP model server. A real-model result was re-exported after server shutdown. Real-model interruption/resume, WebVTT, and Auralis project links do not exist yet.

## Current slices

| Roadmap stage | Working behavior | Gate still open |
| --- | --- | --- |
| S0 | Independent Cargo workspace with pinned Rust 1.95, Taskfile, five dependency-directed crates, a synthetic CC0 fixture, typed translation/run/source/segment IDs, a versioned batch/response contract, a fake provider test, and a versioned source-bound manual JSON manifest. | Production model/profile/policy and cancellation fields are not fixed. |
| S1 | UTF-8 SRT parser accepts optional BOM and consistent LF or CRLF, extracts each text line with byte offsets, reports cue order/timing and protected ranges, and rejects unsupported styling, malformed timing, invalid encoding, and mixed line endings. Parse plus no-op render reproduces source bytes. A validated policy bounds source size, cue count, and line size; CLI rejects an oversized source before reading it into memory. | Broader corpus, fuzz testing, and a declared production SRT subset still need review. |
| S2 | Manual manifest can be edited and rendered into a new SRT. SHA-256 binds it to the original; renderer requires exact IDs and line counts, rejects unsafe text, reparses output, and compares protected bytes and structure. CLI refuses to replace an existing output. A fake provider also passes through the core and format pipeline. | Richer translation payload diagnostics are still required for S5. |
| S3 | A llama.cpp chat adapter, versioned Hy-MT2 experimental profile, local-only endpoint, bounded response, and `translate-experimental` CLI command work. A pinned model/runtime produced [one recorded Chinese smoke output](../eval/experiments/2026-09-24-hy-mt2-first-smoke.md). | Bilingual review, repeated runs, capability checks against the loaded server model, and an operational runtime installer remain. This is feasibility evidence, not a language-quality gate. |
| S4 | [Strict-SRT gate passed](../eval/experiments/2026-09-24-s4-recovery-gate.md). Translate SQLite stores the managed original's identity, ordered source segments and byte ranges, typed block plans, attempts, checkpoints, and immutable results. Recovery closes an orphaned attempt, keeps committed blocks, and skips them on resume. Changed source/profile/input fingerprints conflict. A complete result is rendered and verified through the format adapter before its digest and `validated` run state commit together. The original and stored segment selection regenerate identical output bytes. | This gate applies to the strict SRT/local SQLite path. Source-copy retention/cleanup and runtime lifecycle are later work. |
| S5 | An opt-in SRT planner passes neighboring source cues as read-only context; context and planner policy enter checkpoint fingerprints, while the original prompt-v1 policy fingerprint remains unchanged for existing runs. A separate version-2 Hy-MT2 profile sends a bounded JSON context prompt. Mock protocol tests prove context reaches the model request without becoming an output segment. A [real-model context smoke](../eval/experiments/2026-09-24-context-profile-smoke.md) completed two blocks and preserved SRT structure. A validated profile may set `max_block_attempts` from 1 to 3; failed provider/contract attempts are retried before a checkpoint, and a successful checkpoint records its actual attempt count. The existing profiles default to one attempt. Accepted lines now receive typed `unchanged_source` and `no_cyrillic` warnings in the same durable checkpoint. Warnings remain readable after database reopen and do not block a structurally valid `needs_review` result. | These two warnings are advisory heuristics: names or intentional unchanged text can trigger them, and their absence does not establish translation quality. The context smoke repeated one Russian phrase across two distinct source lines, so the profile is experimental and not selected as a quality improvement. Retry failures are not yet recorded as detailed diagnostics, and retries have no backoff or error classification. Larger licensed corpus, bilingual review, glossary, and comparative model evaluation remain. S5 gate is not passed. |
| S6 | `translate SOURCE STATE_DIR PROFILE SERVER_URL OUTPUT` stores a managed original, a run ID, checkpoints, and a validated result. `resume STATE_DIR RUN_ID PROFILE SERVER_URL OUTPUT` verifies the managed source/profile/plan, resumes missing blocks, or regenerates an already validated result. `pause STATE_DIR RUN_ID` durably requests a pause; the worker checks before and after each model block, records `paused` when it acknowledges the request, and resumes without redoing committed blocks. `status STATE_DIR RUN_ID` reports state, pending pause, saved/total blocks, source hash, warning count, and selected result/review state as schema-v3 JSON. `diagnostics STATE_DIR RUN_ID` lists committed line-level warnings as schema-v1 JSON. `doctor PROFILE MODEL_FILE` streams and verifies the local model's SHA-256. An opt-in checked profile probes `/health`, `/props`, and `/v1/models`, compares the reported alias, runtime build, and context size, then hashes the file at the reported absolute path before opening an attempt. A [checked-server real-model smoke](../eval/experiments/2026-09-24-checked-server-smoke.md) completed with that preflight; a mock-server test proves a hash mismatch prevents inference. The CLI reports `run_id` and saved/total blocks to stderr after each durable checkpoint commit. Output is staged and synced in a sibling temporary file, then linked to the final name with create-new semantics. Mock-server tests cover failure and pause during the second block, resume of only the missing block, source/profile conflicts, status, progress, warnings, and re-export. | The preflight does not cryptographically attest in-memory weights or an independently started server process. Older experimental profiles omit the check for resume compatibility. A pause waits for the current model block's network call to finish. Runtime installation, host-owned server lifecycle, real-model interrupted resume, orphaned-temporary-file cleanup, and stable CLI exit/report modes remain open. The filesystem must support same-directory hard links. S6 gate is not passed. |
| S7–S9 | Not implemented. | Auralis integration, Chinese and Japanese release gates remain. |

The library creates the translated document in memory from the original bytes. The `render` and `translate-experimental` commands write it only after validation. The durable CLI copies the source to `STATE_DIR/sources/<translation_id>.srt` before inference, retains the external original untouched, and stores run state in `STATE_DIR/auralis-translate.sqlite`. The manual manifest and fake provider are development tools, not proof of translation quality.

## Reproduce the current path

From this repository root:

```sh
task check
task inspect -- crates/auralis-translation-formats/tests/fixtures/plain.srt
task cli -- template crates/auralis-translation-formats/tests/fixtures/plain.srt translations.json
```

Edit each `lines` value in `translations.json` while keeping the IDs and number of lines. Then run:

```sh
task cli -- render crates/auralis-translation-formats/tests/fixtures/plain.srt translations.json translated.srt
```

With a separately started loopback llama-server and a validated profile manifest, the first durable CLI path is:

```sh
task cli -- translate source.srt state-dir models/manifests/hy_mt2_1_8b_q4_k_m.experimental.json http://127.0.0.1:18080/ translated.srt
task cli -- resume state-dir RUN_ID models/manifests/hy_mt2_1_8b_q4_k_m.experimental.json http://127.0.0.1:18080/ translated-after-resume.srt
task cli -- status state-dir RUN_ID
task cli -- diagnostics state-dir RUN_ID
task cli -- pause state-dir RUN_ID
task cli -- doctor models/manifests/hy_mt2_1_8b_q4_k_m.experimental.json path/to/Hy-MT2-1.8B-Q4_K_M.gguf
```

The first command prints and flushes `translation_id` and `run_id` after recording the run, so keep the `run_id` if inference stops. During inference, stderr reports `run_id=... saved_blocks=N/M` after loading valid checkpoints and after each newly committed block. `pause` works from another process while translation runs; `status` reports `pause_requested=true` until the worker acknowledges it. `resume` can also re-export an already validated result without contacting the server. The fixed durable CLI language pair is Chinese → Russian; no Japanese capability is claimed.

To require server preflight on a new run, use `models/manifests/hy_mt2_1_8b_q4_k_m.checked.experimental.json` in place of the older experimental profile. It pins llama.cpp b10977, a 2048-token minimum context, model size, and model hash. This streams the local GGUF through SHA-256 before an attempt begins; on the debug-build smoke it added roughly a minute. Keep the original profile file for an existing run because the profile fingerprint is frozen. The checked profile does not manage the server process or prove the bytes held in memory.

These commands use `create_new` semantics: choose paths that do not exist. The default SRT inspection policy permits up to 16 MiB of source bytes, 100,000 cues, and 16 KiB per line; callers may pass a separately validated policy to the library. The fixture is synthetic and its provenance is recorded in `crates/auralis-translation-formats/tests/fixtures/LICENSE.md`. The last verified `task check` passed formatting, Clippy, and 50 behavior tests, including CLI process, doctor SHA checks, checked-server preflight and hash rejection, malformed provider output, bounded context protocol, local HTTP protocol, SQLite v1→v2 migration, source-map persistence, checkpoint and failed-commit progress, pause/resume, bounded retry with persisted attempt count, persisted warnings, complete SRT reconstruction, and corrupt-hash handling. The CLI pause and resume tests use a deterministic mock HTTP model and do not establish real-model quality. See the current command output before reporting a later gate as complete.

## Next implementation steps

1. Complete the versioned batch contract with effective model/profile/policy, cancellation, and runtime identity semantics before treating the experimental model path as a durable run.
2. Expand SRT rejection and round-trip coverage, define bounded input size, and fuzz the parser before treating S1 as production-safe.
3. Repeat the real-model experiment across a larger licensed Chinese corpus, inspect it with a bilingual reviewer, and use the result to choose an effective model profile. The current one-file smoke is only a feasibility check.
4. Add mid-request cancellation and cleanup of orphaned temporary files. Prove real-model interrupted resume on a larger licensed fixture, then implement the cross-database Auralis publication protocol.

The repository is a separate local Git repository. No GitHub remote or Auralis submodule has been configured; those are part of the integration stage after the standalone boundary is stable.
