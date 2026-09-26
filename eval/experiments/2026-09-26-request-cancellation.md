# Active model request cancellation

Date: 26 September 2026. Local S4/S6/S7 lifecycle evidence; no language quality or
release verdict. Public publication remains deferred by the owner.

## Implementation and deterministic checks

The core supplies `RunControl` to the provider without depending on Tokio, HTTP
or SQLite. The llama.cpp adapter polls control during asynchronous headers/body
reads (250 ms default), drops the unfinished request and rechecks pause before
retries/checkpoints. A final-attempt provider error cannot turn pause into failure.
See [the contract](../../docs/architecture/009-request-cancellation.md).

`task check` passed formatting, Clippy and all workspace tests after the correction.
`task test:request-cancellation` passed interrupted headers/bodies, control-read
failure, provider reuse and retry/pause precedence. SRT and WebVTT CLI tests hold
the ninth request unanswered until the client disconnects. The process exits
within a five-second test deadline, stores `paused`, clears its request flag,
retains the first checkpoint and exposes no result/output. Resume requests only
the ninth line, keeping the original unchanged. A keep-alive regression checks
that completed synchronous calls release their idle connections.

The first transport fixture inherited nonblocking mode from its Windows listener
and failed immediately. Explicit blocking mode on the accepted socket fixed it.

## Checked-model probe

Command: `task eval:cli:request-pause`, with absolute `AURALIS_TEST_LLAMA_SERVER`
and `AURALIS_TEST_GGUF` pointing to already installed assets and
`AURALIS_TEST_GPU_LAYERS=99`. The local CUDA runtime directory was prepended to
PATH. No download was performed. A sandboxed invocation failed at child-process
creation (`spawn EPERM`) and was repeated with local execution permitted.

The server used b10977-0ecb159c9, Hy-MT2 1.8B Q4_K_M, 2048 context tokens, one
slot and `--cache-ram 0`, with the unchanged checked experimental profile.

| Identity | SHA-256 |
| --- | --- |
| Optimized CLI | `d00101749636390974e431c5fd7ee92a65da1c1b5638c84cbd6a7f3bed8ea35e` |
| Checked profile | `dba1d341230bc4f1117c6fba8ce55a1127b120864aa8363295bdbc883b98fc3e` |
| GGUF | `dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699` |

Each format contains nine project-authored cues with BOM/CRLF. Eight short lines
form the committed block; the ninth is a longer Chinese paragraph about the file
pipeline. SRT repeats external cue labels; WebVTT has NOTE and mostly absent cue
IDs. These are synthetic text/timings, not an admitted subtitle corpus.

The harness requires one durable checkpoint, a running attempt and an actually
busy `/slots` entry before pause. It checks nonzero pause exit, closed attempt,
`paused` state, no result/output and exact retained checkpoint. It observes the
server return to idle, resumes the same run into its second attempt, checks
protected bytes/timing and both original copies, then re-exports identical output
after stopping the server.

| Format | Run ID | Pause acknowledgment | Server observed idle |
| --- | --- | --- | --- |
| SRT | `a34a6142-847c-4da5-adde-79ebff91a6cb` | 547.62 ms | 582.20 ms |
| WebVTT | `57f0830e-ca40-4655-85f4-e958f9dc59d9` | 429.60 ms | 585.78 ms |

Both runs finish two blocks and two attempts with one `needs_review` result.
Measurements include the pause process, polling and persistence. They are not a
worst-case bound or SLA. Russian adequacy remains unreviewed.

## Failure found by real inference

The first real invocation passed preflight but could not send its first model
request. The single-thread runtime was idle during model hashing, retaining an
unpolled pooled connection. Disabling idle pooling fixed the run; request errors
now preserve their cause chain. Failed artifacts remain under `pause-IGVfTC` and
the successful rerun under `pause-xxL1Ic`, in ignored
`.cache/eval/request-pause-runs/`.

Successful report hashes:

- `srt/report.json`: `dfb693786ee7769128aeb132176fc5f8b0fa8df99475b502a2c0644de559470e`.
- `vtt/report.json`: `34395c8695c5f7fec52e42b3e3af6afaad7795a0869e870047ee3e488c534913`.

Slot/SQLite snapshots, files and logs stay local and are excluded from application
payloads and Git. Native desktop pause, managed child release and same-process
command interleavings have separate gates.
