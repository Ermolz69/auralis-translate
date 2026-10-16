# PERF-03: inference journal latency isolation

Measured on 15 October 2026 (UTC+03:00) under the [frozen plan and declared
amendment](2026-10-14-inference-journal-latency-plan.md). The
[source-free machine report](../reports/2026-10-15-inference-journal-latency.json)
contains exact hashes, UTC run times, all observed phase aggregates, SQLite
settings, failed-attempt metadata and offline export checks. Private per-operation
logs, inputs, state and model responses remain in ignored experiment storage.

## Reproduction and measured boundary

PERF-02 observed 54 `journal_finish` operations totalling 11.288 s in a partial
natural 7B run (p95 1.054 s; maximum 1.220 s). This probe used the same checked
7B GGUF and runtime, with the frozen 32-cue local prefix and zero-context v8
four-slot profile. Each successful real run completed eight chat requests and
eight count preflights, committed eight checkpoints and one result, kept the
source SHA-256 unchanged, and re-exported the result byte-identically offline.
CLI exit 3 denotes a completed result requiring review, not a failed run.

The deterministic storage fixture used 27 chat and 27 preflight finishes per
fresh database. Its three runs did **not** reproduce the seconds-long tail:

| Fixture repeat | Finishes | Finish sum | p50 | p95 | Max |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1 | 54 | 0.124 s | 2.244 ms | 2.597 ms | 2.671 ms |
| 2 | 54 | 0.124 s | 2.250 ms | 2.774 ms | 3.071 ms |
| 3 | 54 | 0.130 s | 2.279 ms | 2.689 ms | 7.354 ms |

The three real local 7B runs did reproduce the latency, despite fewer finish
operations. The first was a WAL-observer diagnostic; the last two disabled WAL
file reads on the measured path. Each p95 is nearest rank over only 16
operations, so it is descriptive rather than a stable tail estimate.

| Real 7B run | Finish sum | p50 | p95 / max | COMMIT sum | Translation execute | CLI wall | Finish share of execute |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| WAL diagnostic | 1.666 s | 43.900 ms | 0.926 s | 1.351 s | 36.020 s | 95.398 s | 4.63% |
| No observer 1 | 3.878 s | 34.399 ms | 0.720 s | 3.869 s | 40.318 s | 97.687 s | 9.62% |
| No observer 2 | 5.817 s | 32.799 ms | 1.215 s | 5.808 s | 41.793 s | 100.873 s | 13.92% |

For the two no-observer runs, mutex wait summed to 0 measured microseconds;
`BEGIN IMMEDIATE` to 0.534/0.588 ms, row read and validation to
1.348/1.460 ms, and `UPDATE` to 1.722/1.676 ms. `COMMIT` accounted for
3.869/5.808 s of the respective 3.878/5.817 s `journal_finish` totals. Eight
chat finishes accounted for 3.656/5.600 s of COMMIT, versus 0.213/0.208 s
for eight count finishes. The measured journal time is nested inside translation
execution; subtracting it is only a theoretical upper bound, not an observed
translation speedup.

## SQLite and WAL finding

The journal connection reported `WAL`, `synchronous=FULL` (SQLite value 2),
`wal_autocheckpoint=1000`, 4,096-byte pages and a 5-second busy timeout. In
the WAL-observer run, a 0.905-second COMMIT occurred with the WAL below 0.31 MB;
the maximum observed WAL size was 0.783 MB, below the approximately 4.12 MB
automatic-checkpoint threshold, and the WAL header salt did not change. This
slow operation did not coincide with an automatic WAL checkpoint. The WAL reads
themselves added measurable overhead to the outer timer and were disabled for
the next two runs.

The latency is isolated to SQLite's COMMIT boundary under real 7B execution.
The underlying OS/storage scheduling or sync mechanism remains unproven;
these measurements do not justify weakening `synchronous`, deferring journal
durability, moving the checkpoint acknowledgement, or changing SQLite's
autocheckpoint threshold. No production speed change was made and no paired
before/after speedup is claimed. The same profile produced different accepted
output hashes, and cold-process/cache state was uncontrolled; the timings are
not a language or whole-file quality comparison.

## Failure retention and durability

The first two fixture commands failed to compile because the new test mixed
incompatible boxed error trait bounds; the test was fixed before a workload
ran. An initial real harness attempt failed before inference because sandboxed
Node could not spawn Git. A second failed before inference because it could not
spawn the CLI. These failures are retained in the private failure inventory;
the second also has a durable failed report. The harness then read Git HEAD
without a child process and ran the bounded local model under approved process
execution. No failed attempt was reclassified as a translation result.

A new writer-lock regression verifies that failed `finish` leaves the request
pending and no checkpoint, then a reopened database accepts the exact finish
idempotently. The existing journal, migration and CLI protocol checks cover
failure retention, resume and offline export. The three real runs additionally
verify unchanged source digests and byte-identical re-export without inference.

## Checks and disposition

`task eval:journal:fixture` passed three fresh 54-finish workloads after the
instrumentation correction; `task eval:journal:real` completed all three 7B
runs; `task eval:journal:publish` wrote the source-free report.
`task test:inference-journal` passed 6 journal, 9 migration and 18 provider
tests. `task test:cli:protocol` passed 7 tests. The first `task fmt` check
reported a formatting difference; after `task fmt:fix`, `task check` initially
stopped on one Clippy `div_ceil` suggestion in the fixture test. The corrected
`task check` then passed formatting, workspace Clippy and all workspace tests.
`task eval:journal:check`, `task plan:check`, `task docs:check`,
`task site:build` and `task site:check` passed. Generated public progress now
includes PERF-03 with its bounded evidence and unproved speedup limitation.

PERF-03 is a completed bounded diagnosis with an open root-cause limitation.
A future optimization would need a separately frozen storage hypothesis and a
paired durable comparison. The observed second-scale COMMIT tail must remain
visible in translation-stage budgets; no change to block size or translation
quality is bundled here.
