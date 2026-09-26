# Committed translation progress events

Date: 26 September 2026. Local changes extend Auralis `8e7b8d0` and Translate
`4650513`. Development remains local; public publication is deferred. The native
invocation exits 0 after the transport, panel, two-database and cleanup checks.

## Implementation

The [event contract](../../docs/architecture/013-committed-progress-events.md)
uses the existing bounded Auralis lifecycle bridge. `EventfulTranslationHostJobs`
decorates storage, emits only after successful writes and is composed before
translation startup recovery. The bridge worker still starts after fallible
initialization. A shared pure `JobSnapshot` conversion avoids separate event and
storage projections.

The panel subscribes to project-scoped translation jobs, project publication
notifications and global invalidation. Notifications request real link/status
reads. A focused observer coalesces in-flight bursts, disposes obsolete generations
and preserves three-second recovery polling. Abortable registration releases
already registered listeners even if another registration stalls, and disposes
late registrations after unmount.

## Supporting evidence

| Command                                                                                                                                                 | Observed result                                                                                                                                                                                                                             |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `task rust:test:translation-events`                                                                                                                     | 2 real-SQLite tests pass: another reader sees committed event revisions/status/counts during the callback; failed optimistic writes emit nothing; completed/cancelled/failed outcomes and a disconnected bridge preserve committed storage. |
| `task fe:test:unit -- src/entities/translation/api/translationEvents.test.ts src/features/translation-run-control/model/observeTranslationRuns.test.ts` | 9 tests pass: project/kind filters, invalidation, partial subscription failure, abort/late cleanup, event refresh without advancing timers, coalescing, stale reads and recovery.                                                           |
| `task fe:test:components -- src/features/translation-run-control/ui/TranslationRunControl.test.tsx`                                                     | 10 tests pass, including preparation/pause controls and event-triggered count/ready-comparison refresh.                                                                                                                                     |
| `task rust:test:storage -- job_repository`                                                                                                              | Existing SQLite history pagination test passes after conversion unification; other tests are filtered out.                                                                                                                                  |
| `task fe:typecheck`, `task fe:lint`                                                                                                                     | Pass.                                                                                                                                                                                                                                       |
| `task quality:fsd-boundaries`, `task quality:ipc-contract`, `task quality:file-size`, `task quality:duplicate-code`                                     | Pass.                                                                                                                                                                                                                                       |
| `task rust:clippy`, `task rust:clippy:native-e2e`                                                                                                       | Pass with warnings denied.                                                                                                                                                                                                                  |
| `task desktop:e2e:native:translation:events`                                                                                                            | Pass with the supplied checked model; terminal identities and scope are recorded below.                                                                                                                                                     |
| `task fe:build`                                                                                                                                         | Pass; delivery guard checks 16 production frontend files and finds no emitted test modules, weights or test data.                                                                                                                           |

Sandboxed Node test invocations initially failed with `spawn EPERM`; the exact
affected tasks passed outside that process-launch restriction. The first new
Rust test build exposed a borrowed mutex error; conversion to a static test error
fixed it. Test callback assertions use a test-only `expect_used` allowance; the
production lint policy is unchanged.

## Native verification protocol

Final documentation checks also pass: Translate `task docs:check` validates
75 active Markdown files, and Auralis `task docs:check` passes five checker tests
and its 31-file documentation contract. Both repositories pass `git diff --check`.

`task desktop:e2e:native:translation:events` uses the already supplied checked
GGUF and llama.cpp runtime in an isolated application-data root. It mounts the
actual panel, subscribes to the typed job transport before Start, clicks the real
button and requires created/started/saved/completed events for one project/job,
increasing revisions, absent dubbing stage, committed `1/1` counts below 100%
before terminal completion, and final 100%. It then requires exactly one ready
comparison notification and the attached-result text in the actual panel.

Bounded static checkpoints mark listener readiness, successful lifecycle
observation and panel readiness. The outer observer requires their order, reads
the completed host job/run/revision/progress from SQLite and retains that summary
in command output. The existing native verifier checks the two databases, closed
attempt, ready publication, separate output, source hashes and protected timing.
The runner removes its sandbox and native frontend build on completion.

The native scenario checks the real transport and final panel state. The focused
timer tests establish event-caused refresh before a polling tick; the native
scenario leaves recovery polling enabled and does not attribute every rendered
state to one event or establish a latency SLA.

## Observed native result

The 26 September invocation completed through the existing checked local model:

- Host job: `393a72ef-c71f-4045-a117-ea1169b86365`.
- Translate run: `a9306f5c-31ea-409a-a9c7-8ddeb0ba66cd`.
- Terminal host revision: `5`; saved/total counts: `1/1`; percent: `100`.
- Ordered markers: `translation-events-listener-ready`,
  `translation-events-committed-progress`, `translation-events-panel-ready`.
- The real listener checked one identity across created/started/progressed/completed
  payloads, increasing revisions and a saved count below 100% before completion.
- The panel observed exactly one ready-comparison notification and an attached
  result. Existing verification passed immutable source, protected timing, closed
  host/Translate attempts, ready separate output and acknowledged publication.
- Runner exit: `0`; application sandbox and native frontend build removed.

This invocation supplied the existing model/runtime via
`AURALIS_TEST_GGUF` and `AURALIS_TEST_LLAMA_SERVER`, prepended the existing CUDA
runtime directory to `PATH`, and set `AURALIS_NATIVE_E2E_MEDIA_READY=1`. No model
was downloaded or embedded. Full preparation verification is included in the
scenario time; no general preparation/progress latency claim is made.

## Limits

Historical result selection, fuller review/edit interactions, concurrent
Pause/deletion/publication, actual process-cleanup failure, bilingual evaluation
and clean-machine delivery remain separate gates. One authored Chinese cue does
not establish subtitle language quality, WebVTT event coverage, representative
throughput or a release-ready product. Weights and evaluation payloads remain
outside application/release content.
