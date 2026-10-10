# Auralis historical subtitle export, 10 October 2026

Status: passed an isolated application and desktop UI slice of `HOST-03` and
`INT-TR03`. This is not a native end-to-end, language, or clean-install gate.

Auralis commit `03add689e98693602f823cb61ecb52282b3bfa5e` on
`feat/translate-review` adds an explicit save action for the selected historical
result. The application re-verifies the original source, frozen run, result
bytes, ready publication, and managed artifact before exporting. The request
binds the displayed result ID and SHA-256. It stages and syncs an SRT or strict
WebVTT file in the chosen directory, publishes without replacing an existing
file, and rejects paths inside Auralis-managed data. Draft export does not
approve speech use or mutate the original/result history.

The isolated two-database application fixtures passed 3/3 cases with exact
base/head bytes for both formats, successful reparse, original-byte retention,
and rejection of stale digest, a destination with different bytes, managed-data
destination, wrong extension, and foreign project. Checks run in the Auralis
worktree:

- `task rs:test:application -- --test translation_export` (3 passed)
- `task rs:test:desktop -- --lib` (63 passed on retry with
  `CARGO_BUILD_JOBS=1`)
- `task rs:check` (workspace passed)
- `task rs:clippy` (workspace all-targets passed after a narrow existing Tauri
  review-command lint exception)
- `task rs:fmt` (passed)
- `task fe:test:unit -- translationExportValidation.test.ts` (1 passed)
- `task fe:test:components -- TranslationReviewDecision.test.tsx --maxWorkers=1 --no-file-parallelism --testTimeout=10000` (2 passed)
- `task fe:test:components -- TranslationReview.test.tsx --maxWorkers=1 --no-file-parallelism --testTimeout=10000` (9 passed)
- `task fe:typecheck`, `task fe:lint`, `task q:desktop-policies`,
  `task q:file-size`, `task q:format-check`, `task docs:check`, and
  `task docs:lint` (passed)

Auralis follow-up commit `91170fe` makes an uncertain export response
recoverable. After closing and reopening the Auralis SQLite pool and rebuilding
the verifier, exact retries to the original path succeed for both historical
SRT and WebVTT revisions; fresh offline re-exports have the same bytes. A
different existing file still fails without being modified. The comparison
reads at most the expected output size plus one byte, and staging leaves no
extra file. `task rs:test:application -- --test translation_export` passed 3/3
again; `task rs:fmt`, `task rs:clippy`, `task q:format-check`,
`task q:file-size`, and `task docs:check` passed after this change. This tests
database reopening, not a killed application process or installed desktop.

The first `task rs:test:desktop -- --lib` attempt was stopped during prolonged
concurrent Windows linking; the bounded one-job retry passed. The export has
not been driven through a real installed desktop, model, restart, or future
speech consumer.
`HOST-03`, G8, and `INT-TR03` therefore remain open. Independent G3–G5 review
and a clean Windows G9 target remain unavailable under the separate
[resource record](2026-10-10-desktop-goal-resource-availability.md).
