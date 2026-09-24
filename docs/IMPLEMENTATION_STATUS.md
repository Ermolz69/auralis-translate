# Implementation status and evidence

Status: 24 September 2026. This log reports observed behavior, not release claims. The first implemented path is **strict plain-SRT inspection and manual replacement**. No real machine translation, SQLite run state, WebVTT, or Auralis project link exists yet.

## Current slices

| Roadmap stage | Working behavior | Gate still open |
| --- | --- | --- |
| S0 | Independent Cargo workspace with pinned Rust 1.95, Taskfile, three dependency-directed crates, a synthetic CC0 fixture, typed translation/run/source/segment IDs, a versioned batch/response contract, a fake provider test, and a versioned source-bound manual JSON manifest. | Production model/profile/policy and cancellation fields are not fixed; SQLite/model adapter crates are not implemented. |
| S1 | UTF-8 SRT parser accepts optional BOM and consistent LF or CRLF, extracts each text line with byte offsets, reports cue order/timing and protected ranges, and rejects unsupported styling, malformed timing, invalid encoding, and mixed line endings. Parse plus no-op render reproduces source bytes. A validated policy bounds source size, cue count, and line size; CLI rejects an oversized source before reading it into memory. | Broader corpus, fuzz testing, and a declared production SRT subset still need review. |
| S2 | Manual manifest can be edited and rendered into a new SRT. SHA-256 binds it to the original; renderer requires exact IDs and line counts, rejects unsafe text, reparses output, and compares protected bytes and structure. CLI refuses to replace an existing output. A fake provider also passes through the core and format pipeline. | Crash-safe atomic file publication and richer translation payload diagnostics are still required for S6. |
| S3–S9 | Not implemented. | Real inference, durability, evaluation, standalone production workflow, Auralis integration, and language gates remain. |

The library creates the translated document in memory from the original bytes. The `render` command writes it only after validation. The source path is read only and remains available for later comparison. The manual manifest is a development tool, not proof of translation quality.

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

These commands use `create_new` semantics: choose paths that do not exist. The default SRT inspection policy permits up to 16 MiB of source bytes, 100,000 cues, and 16 KiB per line; callers may pass a separately validated policy to the library. The fixture is synthetic and its provenance is recorded in `crates/auralis-translation-formats/tests/fixtures/LICENSE.md`. The last verified `task check` passed formatting, Clippy, and sixteen behavior tests, including CLI process tests and tests that reject malformed provider output. See the current command output before reporting a later gate as complete.

## Next implementation steps

1. Complete the versioned batch contract with effective model/profile/policy and cancellation semantics before connecting a real runtime.
2. Expand SRT rejection and round-trip coverage, define bounded input size, and fuzz the parser before treating S1 as production-safe.
3. Build a real, pinned model adapter and record inference evidence for S3. Do not infer language quality from the manual path.
4. Add Translate SQLite migrations and checkpoint/resume, then the cross-database Auralis publication protocol in the order given by the roadmap.

The repository is a separate local Git repository. No GitHub remote or Auralis submodule has been configured; those are part of the integration stage after the standalone boundary is stable.
