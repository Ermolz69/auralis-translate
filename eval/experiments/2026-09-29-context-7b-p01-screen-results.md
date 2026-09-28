# Real 7B v5 screen on the actor-number scene

Status: unsuccessful semantic screen for `CTX-02`/`EVAL-04`, run at
22:06:25–22:07:41 UTC on 28 September (29 September local, UTC+03). The
[frozen plan](2026-09-29-context-7b-p01-screen-plan.md) fixed one authored
development scene, order and limits before inference. This is an AI
source-aware interpretation, not an independent bilingual judgment.

The [raw report](../reports/context-7b-p01-screen-2026-09-29.json) has SHA-256
`ef5b8ad94bbf49fc34f866884f4d3d12162bbdfb08221711b13696cbf348e98e`.
The [journal comparison](../reports/context-7b-p01-screen-journal-check-2026-09-29.json)
has SHA-256
`0f426fc6c7c7d51e7a58fbd68e4aff8e0e67be34ed6d670c9c4c976f449a2309`.
The checked run used commit `0f16d11`; the only dirty tracked file was the
owner's unrelated `docs/architecture/014-result-history-selection.md`.
The optimized CLI SHA-256 was
`18bd84721b31d01a18906662c3ecd191709e5ac9d6d8e9add91471060a3fa80e`.
The report retains all rendered requests, raw responses, accepted text,
usage, durations, source/output identities and process/device samples.

The verified Hy-MT2 7B Q4_K_M file had revision
`ab8472660ac61fac25f1af43fac2599d52a8a775`, 4,624,648,896 bytes and
SHA-256
`9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b`.
The runtime was llama.cpp `b10977-0ecb159c9`, executable SHA-256
`6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`.
It requested 99 GPU layers, one slot, 2,048 context tokens and zero RAM cache.
An exact offload-layer count was not emitted. The two profile hashes are in
the plan and report; the profile test found no policy difference from the
corresponding 1.8B v5 profiles beyond model identity.

## Paired observation

The source is the same exact three-cue SRT and scene map as the earlier
[1.8B journal run](2026-09-29-inference-journal-paired-results.md): source
SHA-256 `ec2118591a6803f282ba2496ef99975584d4de468de2bc3277a4c3bca9776275`,
map SHA-256 `b94fb82238847d56d5a378407a128eae887e71d13c7c8d6bdece86f53f34b83c`.
The source sequence is `哥哥刚下车。` → `到了。` → `门开了。`; the AI-authored
proposal for the target is `Он уже приехал.` and was absent from the model
requests. The preceding cue names one older brother, not a group.

| Model, one repetition | No source context | Same-scene source context |
| --- | --- | --- |
| 1.8B Q4_K_M, prior run | `Пришло.` | `Приехали.` |
| 7B Q4_K_M, this run | `Прибыли.` | `Мы приехали.` |

All four observations are retained; none is selected as a correct translation.
The 7B scene output still supplies a plural actor (`мы`) where the preceding
source cue supplies a singular older brother. The larger model therefore did
not remove the observed `REG-002` failure on this source. The earlier 1.8B
regression pack already contains two related singular actors and an explicit
two-person negative control; this screen does not claim those 7B controls ran.

Both 7B files validated structurally, preserved the source and re-exported
byte-identically after server stop. The run recorded 18 loopback requests,
including six HTTP-200 chat completions, with no command or validation
failure. The SQLite checker matched all six rendered body hashes, raw replies,
token counts and saved target lines; it also confirmed the proposed reference
was absent from each prompt. Baseline chats used 534 prompt and 82 completion
tokens, scene chats 661 and 82. Summed chat HTTP time was 1,652.323 and
1,725.548 ms; complete file times were 24,367.394 and 24,290.327 ms.

On this active Windows 10/i7-6900K/RTX 3070 8 GiB desktop, 48 approximate
one-second samples observed a server working-set peak of 5,060,124,672 bytes
and whole-device GPU-used peak of 5,455 MiB. These are sampled lower bounds
for peaks and GPU memory includes other processes. The two models ran on
different occasions and CLI binaries, so this one-pair screen is not a
controlled speed comparison. No full-file, license-cleared scene, clean-machine
or human-review gate follows from it.

`task eval:context:7b:probe` passed its script precheck, 14 profile/release
tests, release build and bounded real run. `task eval:context:7b:journal:check`
passed the durable comparison. `task eval:regression:check` passed its four
index tests and both report checkers, including the new 7B token and budget
controls. `task fmt`, `task lint`, `task plan:check`, `task docs:check`,
`task site:build` and `task site:check` passed after the report was wired into
the public site; the site checker retained 420 earlier requests. The failed
actor-number observation remains open; a larger model alone is not a
justified fix.
