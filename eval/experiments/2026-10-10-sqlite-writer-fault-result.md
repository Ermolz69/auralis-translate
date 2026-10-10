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

## Instrumented committed verification

The first capture attempt in the default sandbox stopped before the test:
the `git status --porcelain` child returned a null process status. The
[preflight failure record](../reports/2026-10-10-sqlite-writer-fault-capture-preflight-failure.json)
retains the known facts and leaves its unobserved timestamp and child error
detail null. No SQLite fault was injected in that attempt.

The same committed capture script at `0004343a15f962773291d0f2bbba8c64be10a78f`
then ran once with child-process access. Its [machine-readable record](../reports/2026-10-10-sqlite-writer-fault-v1.json)
is SHA-256 `fce568a49463e3b8ff285ab827bedbddd15939471139657f5f2a483159aeadb7`.
It records a clean worktree, 2026-10-10 12:20:49.848–12:20:50.410 UTC,
561 ms measured wrapper time, exit 0, both named tests passed, raw stdout
and stderr hashes, Windows 10.0.19045, Intel i7-6900K and 51,458,560,000
reported physical memory bytes. The raw process logs remain in ignored
private storage. No process memory peak was sampled. `task
eval:sqlite:writer-fault:check` verifies the public record and the test
source hash; it does not rerun the test or expand the G7 claim.
The first public checker invocation failed on a transcribed SHA-256 literal;
the literal was corrected from the copied report bytes and the same checker
then passed. The captured report and private raw logs were not rewritten.

This proves the two targeted database transactions under an injected writer
lock. It does not test the CLI or host process, actual power loss, disk full,
OOM, simultaneous edit/selection, a 10,000-cue soak, or natural-file quality.
The `LONG-03` dependency and the rest of `LONG-05` remain open; G7 and
`RELEASE-05` are not passed. The next reliability step is to repeat bounded
faults at the CLI/host boundary on a fully selected candidate, then exercise
the remaining disk/resource/rejection matrix without publishing partial media.
