# Implementation status and evidence

Status: 24 September 2026. This log reports observed behavior, not release claims. Strict plain-SRT inspection and manual replacement work. An experimental real-model path has produced a separate Russian SRT from a small Chinese fixture. An initial Translate SQLite layer stores run attempts and accepted checkpoints. End-to-end resume, WebVTT, and Auralis project links do not exist yet.

## Current slices

| Roadmap stage | Working behavior | Gate still open |
| --- | --- | --- |
| S0 | Independent Cargo workspace with pinned Rust 1.95, Taskfile, five dependency-directed crates, a synthetic CC0 fixture, typed translation/run/source/segment IDs, a versioned batch/response contract, a fake provider test, and a versioned source-bound manual JSON manifest. | Production model/profile/policy and cancellation fields are not fixed. |
| S1 | UTF-8 SRT parser accepts optional BOM and consistent LF or CRLF, extracts each text line with byte offsets, reports cue order/timing and protected ranges, and rejects unsupported styling, malformed timing, invalid encoding, and mixed line endings. Parse plus no-op render reproduces source bytes. A validated policy bounds source size, cue count, and line size; CLI rejects an oversized source before reading it into memory. | Broader corpus, fuzz testing, and a declared production SRT subset still need review. |
| S2 | Manual manifest can be edited and rendered into a new SRT. SHA-256 binds it to the original; renderer requires exact IDs and line counts, rejects unsafe text, reparses output, and compares protected bytes and structure. CLI refuses to replace an existing output. A fake provider also passes through the core and format pipeline. | Crash-safe atomic file publication and richer translation payload diagnostics are still required for S6. |
| S3 | A llama.cpp chat adapter, versioned Hy-MT2 experimental profile, local-only endpoint, bounded response, and `translate-experimental` CLI command work. A pinned model/runtime produced [one recorded Chinese smoke output](../eval/experiments/2026-09-24-hy-mt2-first-smoke.md). | Bilingual review, repeated runs, capability checks against the loaded server model, and an operational runtime installer remain. This is feasibility evidence, not a language-quality gate. |
| S4 | Translate SQLite schema v1 creates translation, segment, run, attempt, checkpoint, result, edit, and diagnostic tables. Translation/run identities and immutable fingerprints are checked on retry. A typed block plan and checkpoint text are validated before a transaction commits; duplicate writes are idempotent and changed writes conflict. Attempts move runs between requested/running/paused/failed, and recovery closes one orphaned attempt while retaining committed blocks. | No application service yet feeds validated provider blocks into this store or skips completed blocks automatically. Source segments and immutable result selection are not yet populated. No complete output is published from the database. Cancellation, source-copy ownership, final result regeneration, and cross-database recovery remain open; S4 gate is not passed. |
| S5–S9 | Not implemented. | Quality evaluation, standalone production workflow, Auralis integration, and language gates remain. |

The library creates the translated document in memory from the original bytes. The `render` and `translate-experimental` commands write it only after validation. The source path is read only and remains available for later comparison. The SQLite tests exercise recovery primitives directly; the CLI does not yet use them. The manual manifest and fake provider are development tools, not proof of translation quality.

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

These commands use `create_new` semantics: choose paths that do not exist. The default SRT inspection policy permits up to 16 MiB of source bytes, 100,000 cues, and 16 KiB per line; callers may pass a separately validated policy to the library. The fixture is synthetic and its provenance is recorded in `crates/auralis-translation-formats/tests/fixtures/LICENSE.md`. The last verified `task check` passed formatting, Clippy, and 28 behavior tests, including CLI process, malformed provider output, local HTTP protocol, SQLite migration, checkpoint, and interruption/recovery tests. See the current command output before reporting a later gate as complete.

## Next implementation steps

1. Complete the versioned batch contract with effective model/profile/policy, cancellation, and runtime identity semantics before treating the experimental model path as a durable run.
2. Expand SRT rejection and round-trip coverage, define bounded input size, and fuzz the parser before treating S1 as production-safe.
3. Repeat the real-model experiment across a larger licensed Chinese corpus, inspect it with a bilingual reviewer, and use the result to choose an effective model profile. The current one-file smoke is only a feasibility check.
4. Connect the validated provider path to Translate SQLite checkpoints, skip completed blocks on resume, and persist an immutable result only after complete output verification. Then implement the cross-database Auralis publication protocol in the order given by the roadmap.

The repository is a separate local Git repository. No GitHub remote or Auralis submodule has been configured; those are part of the integration stage after the standalone boundary is stable.
