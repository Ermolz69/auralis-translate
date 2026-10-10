# Translate SQLite writer contention: bounded recovery result

Date: 10 October 2026. This follows the frozen
[fault plan](2026-10-10-sqlite-writer-fault-plan.md) and is partial `LONG-05`
engineering evidence, not G7 acceptance.

## Exact target and observations

- Candidate before this change: `9c96e8919fd0eb2912d75389debe8adb434e3831`.
- Test source: `crates/auralis-translation-sqlite/tests/sqlite_writer_fault.rs`,
  SHA-256 `c9dea2b2beb6e26e5249c058b65fbcf1ee63da2f19de76769c2e127a0628f0a9`.
- One owned two-cue strict-SRT fixture, one SQLite writer lock with a 50 ms
  busy timeout, one failed checkpoint write, one worker restart and resume
  per case. No model, media, TTS, network request or retry loop.
- `task test:sqlite:writer-fault` passed: 2/2 tests in 0.09 s. The lock
  returned SQLite `DatabaseBusy` or `DatabaseLocked` as required.
- First-block case: the failed write left zero checkpoints and no result.
  Later-block case: the prior checkpoint remained byte-equivalent to the
  pre-fault row and there was no result. After closing the worker, releasing
  the lock and reopening SQLite, both runs transitioned through recovery,
  resumed to two checkpoints and committed one validated result. Rendered
  output hash and source hash matched the pinned plan.
- `task fmt`, `task lint`, `task plan:check`, `task docs:check` passed after
  formatting the test. No product logic changed, and no confirmed product
  defect or new regression ID arose from this injection.

This proves the two targeted database transactions under an injected writer
lock. It does not test the CLI or host process, actual power loss, disk full,
OOM, simultaneous edit/selection, a 10,000-cue soak, or natural-file quality.
The `LONG-03` dependency and the rest of `LONG-05` remain open; G7 and
`RELEASE-05` are not passed. The next reliability step is to repeat bounded
faults at the CLI/host boundary on a fully selected candidate, then exercise
the remaining disk/resource/rejection matrix without publishing partial media.
