# Native concurrent starts during model preparation

Date: 26 September 2026. Auralis extends local `cabf8c6`; Translate implementation
is pinned to `25dd475`. Work remains local. The corrected native invocation exits
0 after ready-file and sandbox cleanup checks. Only the named concurrency
boundaries below are verified.

## Purpose and exact scope

The [host job contract](../../docs/architecture/006-host-translation-jobs.md)
distinguishes preparation without a host job from an accepted worker. This scenario
adds two parallel native IPC requests at each named boundary to the existing real
UI initial-hash Pause/Continue path:

1. While the first Start owns an actually observed partial model hash, two additional
   `start_translation_run_cmd` calls run through `Promise.allSettled`. Both must
   reject with typed `BUSY`; the UI status must retain the requested run, no active
   host job, no pause flag, zero saved blocks and no result.
2. The real Pause control acknowledges the retained run. The outer observer checks
   all seven admitted/partial counts are zero, original/run identities match, the
   control revision advanced once, no new model PID exists and the same model hash
   ended failed after fewer than all bytes.
3. Continue performs fresh verification. After acceptance and panel remount, two
   parallel Start calls must both return `accepted` with the same exact run and
   active host-job IDs. Status must remain paused worker preflight without saved
   blocks or a result. Neither call may obtain a different attempt identity.
4. Final real inference must produce one closed host job and one closed Translate
   attempt on that run, a ready separate `needs_review` artifact, unchanged external
   and managed originals, completed outbox publication and final child release.

```mermaid
sequenceDiagram
    participant UI as Native React controls
    participant IPC as Auralis scheduler
    participant Model as Owned model slot
    participant DB as Both SQLite databases
    UI->>IPC: Start
    IPC->>Model: Initial checked-file hash
    par Additional request 1
        UI->>IPC: Start same run
        IPC-->>UI: BUSY
    and Additional request 2
        UI->>IPC: Start same run
        IPC-->>UI: BUSY
    end
    UI->>IPC: Actual Pause button
    IPC->>DB: Retain paused run; no admitted work
    UI->>IPC: Actual Continue button
    IPC->>Model: Fresh full checks
    IPC->>DB: Accept one host job
    UI->>IPC: Two parallel Start calls during worker preflight
    IPC-->>UI: Same accepted job and run for both
    IPC->>DB: One attempt; validated result; ready separate output
```

These are real IPC requests on one desktop owner. They do not establish arbitrary
same-instant ordering, simultaneous Pause/deletion/publication, or every scheduler
interleaving. The original UI request stays pending during the first pair.

## Observation channel and delivery

The native-only frontend helper validates every actual reply and writes a bounded
JSON observation through the existing `native_e2e_checkpoint_cmd`. Rust accepts
only the two declared boundary names, exactly two outcomes, valid UUIDs and the
known status/code/identity fields, with no extra fields, raw newlines or payload
above 1024 bytes. This validator is compiled only with `native-e2e`; the ordinary
command remains unavailable. No production API schema or scheduler policy changes.

The outer observer rejects missing, duplicate or reordered observations, wrong
run/job IDs, a successful initial duplicate, a non-BUSY rejection and any accepted
worker reply that does not reuse the final completed host job. Hash and database
checks remain mandatory; frontend observations cannot replace them.

Weights and the authored fixture remain separate from production payloads. Inputs,
the installed Windows/CUDA bench and the environment setup match the
[initial-hash pause record](2026-09-26-native-initial-hash-pause.md). Run
`task desktop:e2e:native:translation:start-race` from the Auralis checkout with
those existing asset variables. Each invocation owns an isolated temporary data
root and cleans its test frontend build when terminal.

## Supporting checks and first failure

- `task fe:typecheck`, `task fe:lint`, `task quality:fsd-boundaries`,
  `task quality:ipc-contract`, `task quality:file-size` and
  `task quality:duplicate-code`: pass.
- `task desktop:e2e:native:preparation:check`: twenty observer tests pass, including
  four added concurrent-reply rejection checks. This is supporting verifier evidence.
- `task rust:fmt-write`: passes. `task rust:test:desktop -- --features native-e2e native_e2e_observation_tests`:
  three bounded-channel tests pass, with other desktop tests filtered. The first
  build attempt failed with Windows access error 5 while the earlier native app
  was live; the exact task succeeds after that app reaches terminal cleanup and
  child-process/build access is permitted. The precise OS denial cause is unproven.
- The first native invocation receives actual `BUSY` command diagnostics for the
  duplicate requests, but fails before Pause because its JSON checkpoint was not
  included in the native command's allowlist. The terminal error is `Native controls
  did not acknowledge preparation pause`; the trace records `VALIDATION` for the
  checkpoint command. It reaches terminal failure and cleanup before the corrected
  invocation. That invocation is not a passing lifecycle result.
- The bounded native-only validator is then added and checked before repetition.
- `task rust:clippy:native-e2e`: the feature-enabled desktop/all-target check passes
  with denied warnings. `task fe:build`: ordinary production bundle budgets and
  delivery checks pass for sixteen frontend files, with no emitted native test
  modules, weights or evaluation payloads.
- `task rust:clippy`: ordinary locked workspace/all-target check also passes with
  denied warnings. The successful-start observer rejection keeps two replies, so
  it exercises status validation independently of the required reply count.
- Translate `task docs:check`: links pass across 73 active Markdown files. Auralis
  `task docs:check`: five checker tests and the 31-file documentation contract pass.

## Corrected native result

`task desktop:e2e:native:translation:start-race` exits 0 on the corrected full
invocation. Both actual initial-hash replies are `rejected/BUSY`. The original
operation stops after 7,471,104 of 1,133,080,448 bytes; no new model PID or any of
the seven admitted/partial records exists at pause. UI acknowledgment is 235 ms,
and the durable control revision advances from 0 to 1.

Continue performs three distinct complete hashes. Both worker-preflight replies
are `fulfilled/accepted`, and their exact job/run identities match the single
completed final job and retained run. Final checks find exactly one closed host
job and one closed Translate attempt, a ready separate `needs_review` result,
matching source/output digests and completed outbox actions. External and managed
originals are unchanged; final model-child release and sandbox/native-frontend
cleanup pass.

| Corrected full invocation | Value |
| --- | --- |
| Run | `c515d3da-79e9-4330-840d-74fc3cc1d57e` |
| Translation | `d97f756f-92f4-444e-b2e4-505d43a24f27` |
| Both accepted replies and completed host job | `788d7784-7675-4b5a-85dc-8ce96f9da348` |
| Initial additional replies | two `BUSY` rejections |
| Worker-preflight additional replies | two `accepted` replies with the same job/run |
| Paused jobs / associations / attempts | 0 / 0 / 0 |
| Paused checkpoints / results / publications / output artifacts | 0 / 0 / 0 / 0 |
| UI Pause acknowledgment | 235 ms |
| Interrupted hash bytes | 7,471,104 of 1,133,080,448 |
| Fresh complete hash operations | 2, 3, 4 |
| Final closed host jobs / Translate attempts | 1 / 1 |
| Source SHA-256 | `e88cbac25d7b05d1bd1f19d738b2eb3d8b5198e5ad550b9960f1de98cc0776a8` |
| Output SHA-256 | `e1bd07b25695411ec29cc5a55813e3c0e7094de94cebf8c3e528682127325cf3` |

The interrupted operation starts at `2026-09-26T17:24:22.870632Z` and ends failed
at `2026-09-26T17:24:23.380376Z`. Fresh complete operations end at
`2026-09-26T17:25:42.853659Z`, `2026-09-26T17:27:02.522475Z` and
`2026-09-26T17:28:19.964499Z`. The 235 ms UI measurement includes the actual
Pause interaction after the initial duplicate replies. It is not a claim about
their latency or the exact persistence/termination instant, and is not an SLA.

## Remaining gates

Additional concurrent/repeated Start/Pause/Continue, deletion/publication, resource
selection and OS cleanup-failure scenarios remain open. This one-cue authored input
does not establish source-aware language quality, a clean Windows installation or
an acknowledgment/hardware SLA. S7 and G7 remain open beyond the named boundaries.
Public repository/release publication stays deferred by the owner.
