# Cooperative model preparation and pause

Date: 26 September 2026. Translate library/CLI implementation: `6cfcec4`, followed
by the CLI process regression. Auralis changes follow `e7f568f` locally. No public
publication or model/corpus download was performed.

## Implementation

[Preparation control](../../docs/architecture/011-preparation-cancellation.md)
reaches model hashing before file open and between 64 KiB chunks, pinned runtime
archive verification/decompression/installed-file hashing, and readiness HTTP
headers/body reads. Existing uncontrolled callers use the same implementation
with an always-ready callback. Identity hashes, length checks, archive bounds,
declared files and model/runtime preflight checks remain required.

Auralis acquisition polls the linked durable admission guard and signals an owned
token on a control change/error. It waits for acquisition cleanup before returning.
Initial hashing and package checks are cooperatively cancelled; readiness workers
also check the existing startup deadline. The old `timeout_at` around a blocking
probe/hash was removed because dropping its future could detach that work.
On acquisition failure, the owned model child is killed/reaped before the permit
is released. Failure to clean up returns typed `CleanupFailed`; admission does
not hide it as cancellation. The native mapper uses `RECOVERY_REQUIRED` with a
sanitized message. Drop guards signal unfinished preparation on caller abandonment
and are disarmed when a runtime lease is successfully returned.

The host executor and CLI use the SQLite guard control during their final checked
server preflight too, then check it without throttling before considering any
preflight outcome. The atomic attempt-start guard remains the final authority.
No checkpoint/result payload or schema v5 wire status changed.

The actual React run panel now offers pause while start/resume prepares the model,
shows a preparation label and treats the `CANCELLED` outcome as a retained paused
run. Publication busy state does not create a preparation-pause action.

## Commands and observed evidence

- Translate `task check` passed formatting, Clippy and the full workspace suite.
- Translate `task test:preparation` passed five package tests, two hash tests,
  five transport/policy tests and one CLI-process case with initial/resume paths.
  Hash cancellation stops before the complete digest and a fresh check produces
  the expected digest. Runtime verification cancellation retains a verifiable
  installed package. Readiness cancellation closes unanswered headers and an
  incomplete body. Existing active-inference cancellation/reuse tests still pass.
- The CLI-process case issues a separate machine pause while checked preflight's
  health request is unanswered. Initial start and repeated pause during explicit
  resume both exit 5 with a `paused` terminal event, close the request, retain the
  same run and original, and leave zero attempts/results/checkpoints/output files.
  Synthetic profile/model identity and controlled HTTP are test inputs, not model
  support evidence. The fixture first used the wrong installed package root and
  an uppercase wire code; the corrected test uses the returned root and the actual
  lowercase machine contract. The CLI adds rusqlite only as a development dependency
  to inspect the actual attempt/result tables.
- Auralis `task rs:test:application -- --test translation_admission_pause` initially
  passed seven tests, including cancelling initial/resumed admission without
  releasing its runtime barrier, plus policy bounds. An additional cleanup-failure
  case was added to the full application gate.
  Final `task rs:test:application` passed its full default suite, including all
  eight admission tests and the injected cleanup-failure case. Runtime/package
  real-model tests in that default suite remain opt-in.
- Auralis `task rs:test:translate` passed all default adapter tests, including
  pre-cancelled acquisition with no file access and released admission slot.
  Its installed-model/package cases are explicitly opt-in.
- Auralis `task rs:clippy` passed all workspace targets with warnings denied after
  adding cleanup error classifications. Windows process-wrap returns a boxed kill
  future; pinning it before awaiting fixed the initial compilation error.
- `task fe:test:components -- src/features/translation-run-control/ui/TranslationRunControl.test.tsx`
  passed six tests, including actual preparation-pause buttons for initial start
  and resumed paused state, no cancellation alert and an enabled resume afterward.
  `task fe:typecheck` and `task fe:lint` passed.
- `task rs:test:translate -- --test managed_runtime_real -- --ignored --nocapture`
  passed in **166.66 seconds** with the already installed b10977-0ecb159c9 server,
  checked Hy-MT2 1.8B Q4_K_M model, GPU layers 99, local CUDA PATH and zero RAM cache.
  It verifies successful checked admission, one reported slot, a reachable server
  and loss of reachability after releasing its owned lease. It does not generate
  translations or interrupt that real preparation.

## Remaining evidence

Follow-up [native post-child preparation evidence](2026-09-26-native-preparation-pause.md)
now verifies actual Start/Pause/Continue controls, one 310 ms UI acknowledgement,
zero admitted records, observed child absence and fresh resume. The limitations
below describe the original controlled-test slice; native initial hashing and
command races remain open.

The real runtime completion is not a real preparation-cancellation verdict.
Native UI pause during initial hashing and after child startup, acknowledgment
latency, child/slot cleanup and fresh resume still need a separately observed
scenario. OS filesystem calls cannot be arbitrarily preempted. Controlled cleanup
failure tests do not inject a Windows kernel kill failure. Concurrent deletion,
same-process command races, fresh package audit, clean Windows installation and
bilingual language gates remain open.
