# Implementation status and evidence

Status: 24 September 2026. This log reports observed behavior, not release claims. Strict plain-SRT inspection and manual replacement work. A real model has produced a separate Russian SRT through both the experimental path and the durable CLI. Translate SQLite stores run attempts, accepted checkpoints, and immutable results. A CLI test covers managed-source copying, model failure, restart, completion, and reconstruction against a mock HTTP model server. A real-model result was re-exported after server shutdown. Real-model interruption/resume, WebVTT, and Auralis project links do not exist yet.

## Current slices

| Roadmap stage | Working behavior | Gate still open |
| --- | --- | --- |
| S0 | Independent Cargo workspace with pinned Rust 1.95, Taskfile, five dependency-directed crates, a synthetic CC0 fixture, typed translation/run/source/segment IDs, a versioned batch/response contract, a fake provider test, and a versioned source-bound manual JSON manifest. | Production model/profile/policy and cancellation fields are not fixed. |
| S1 | UTF-8 SRT parser accepts optional BOM and consistent LF or CRLF, extracts each text line with byte offsets, reports cue order/timing and protected ranges, and rejects unsupported styling, malformed timing, invalid encoding, and mixed line endings. Parse plus no-op render reproduces source bytes. A validated policy bounds source size, cue count, and line size; CLI rejects an oversized source before reading it into memory. | Broader corpus, fuzz testing, and a declared production SRT subset still need review. |
| S2 | Manual manifest can be edited and rendered into a new SRT. SHA-256 binds it to the original; renderer requires exact IDs and line counts, rejects unsafe text, reparses output, and compares protected bytes and structure. CLI refuses to replace an existing output. A fake provider also passes through the core and format pipeline. | Richer translation payload diagnostics are still required for S5. |
| S3 | A llama.cpp chat adapter, versioned Hy-MT2 experimental profile, local-only endpoint, bounded response, and `translate-experimental` CLI command work. A pinned model/runtime produced [one recorded Chinese smoke output](../eval/experiments/2026-09-24-hy-mt2-first-smoke.md). | Bilingual review, repeated runs, capability checks against the loaded server model, and an operational runtime installer remain. This is feasibility evidence, not a language-quality gate. |
| S4 | [Strict-SRT gate passed](../eval/experiments/2026-09-24-s4-recovery-gate.md). Translate SQLite stores the managed original's identity, ordered source segments and byte ranges, typed block plans, attempts, checkpoints, and immutable results. Recovery closes an orphaned attempt, keeps committed blocks, and skips them on resume. Changed source/profile/input fingerprints conflict. A complete result is rendered and verified through the format adapter before its digest and `validated` run state commit together. The original and stored segment selection regenerate identical output bytes. | This gate applies to the strict SRT/local SQLite path. Source-copy retention/cleanup, user-facing cancellation/progress, and quality diagnostics are later work. |
| S5 | Not implemented. | Quality evaluation, context planning, glossary, bounded retries, and language review remain. |
| S6 | `translate SOURCE STATE_DIR PROFILE SERVER_URL OUTPUT` stores a managed original, a run ID, checkpoints, and a validated result. `resume STATE_DIR RUN_ID PROFILE SERVER_URL OUTPUT` verifies the managed source/profile/plan, resumes missing blocks, or regenerates an already validated result. `status STATE_DIR RUN_ID` reports state, saved/total blocks, source hash, and selected result/review state as versioned JSON. `doctor PROFILE MODEL_FILE` streams and verifies the local model's SHA-256 against the versioned profile; the pinned 1.13 GB GGUF passed. The CLI reports `run_id` and saved/total blocks to stderr on startup and after each durable checkpoint commit. Output is staged and synced in a sibling temporary file, then linked to the final name with create-new semantics; an interrupted write cannot expose a partial final file. A nine-cue mock-server test fails on the ninth model request, resumes only the missing block, and checks source/profile conflicts, status, progress, and re-export. A [durable real-model smoke](../eval/experiments/2026-09-24-durable-cli-smoke.md) produced Russian SRT and re-exported the same bytes after server shutdown. | No cancellation, runtime installation, server capability/loaded-weight attestation, or real-model interrupted-resume smoke yet. The CLI expects a running loopback llama-server. The filesystem must support same-directory hard links; an interrupted process may leave an unselected temporary file for later cleanup. S6 gate is not passed. |
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
task cli -- doctor models/manifests/hy_mt2_1_8b_q4_k_m.experimental.json path/to/Hy-MT2-1.8B-Q4_K_M.gguf
```

The first command prints `translation_id` and `run_id` after recording the run, so keep the `run_id` if inference stops. During inference, stderr reports `run_id=... saved_blocks=N/M` after loading valid checkpoints and after each newly committed block. `resume` can also re-export an already validated result without contacting the server. The fixed durable CLI language pair is Chinese → Russian; no Japanese capability is claimed.

These commands use `create_new` semantics: choose paths that do not exist. The default SRT inspection policy permits up to 16 MiB of source bytes, 100,000 cues, and 16 KiB per line; callers may pass a separately validated policy to the library. The fixture is synthetic and its provenance is recorded in `crates/auralis-translation-formats/tests/fixtures/LICENSE.md`. The last verified `task check` passed formatting, Clippy, and 37 behavior tests, including CLI process, doctor SHA checks, malformed provider output, local HTTP protocol, SQLite migration, source-map persistence, checkpoint and failed-commit progress, model-failure/resume, complete SRT reconstruction, and corrupt-hash handling. The CLI resume test uses a deterministic mock HTTP model and does not establish real-model quality. See the current command output before reporting a later gate as complete.

## Next implementation steps

1. Complete the versioned batch contract with effective model/profile/policy, cancellation, and runtime identity semantics before treating the experimental model path as a durable run.
2. Expand SRT rejection and round-trip coverage, define bounded input size, and fuzz the parser before treating S1 as production-safe.
3. Repeat the real-model experiment across a larger licensed Chinese corpus, inspect it with a bilingual reviewer, and use the result to choose an effective model profile. The current one-file smoke is only a feasibility check.
4. Add cancellation and cleanup of orphaned temporary files. Prove real-model interrupted resume on a larger licensed fixture, then implement the cross-database Auralis publication protocol.

The repository is a separate local Git repository. No GitHub remote or Auralis submodule has been configured; those are part of the integration stage after the standalone boundary is stable.
