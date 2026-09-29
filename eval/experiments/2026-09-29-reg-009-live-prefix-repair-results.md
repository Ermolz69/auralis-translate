# REG-009 real 1.8B source-prefix screen: retained observations

Status: complete bounded synthetic development screen, 29 September 2026;
source-aware AI editorial findings, independent human review missing. The
[predeclared plan](2026-09-29-reg-009-live-prefix-repair-plan.md) and harness
were committed at `fcaf911` before inference. The first invocation passed its
hash/source preflight but stopped at sandbox `spawnSync git EPERM` before starting
a server or requesting a model response; the [failure record](../reports/2026-09-29-reg009-live-prefix-repair-preinference-failure.json)
retains it. The same committed task then ran with local process permission.
There was no retry or discarded model observation.

The checked Hy-MT2 1.8B Q4 GGUF SHA-256 was
`dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699`,
llama-server SHA-256
`6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`,
opt-in profile SHA-256
`e80c80b0cf1db26d62ce5f644091f30e42fea752d27a0ce201fcab33f29ecb69`,
and unchanged prompt template SHA-256
`137efcbd09400d7ad2ab6c257077f96e09d7ff0c2eac2a35c067cdcbd7ef6a18`.
The 27 targets at beginning, cue-129 seam, middle and end of the same
project-authored 1,024-cue synthetic source were drawn from the archived
source-only journal SHA-256
`4037c071a17ef38ed7b9bc4989601ef8da0784fb39881b9138abb9d008701a8c`.
Seeds 101/202/303 gave 81 complete, zero-retry requests. No Russian reference
was in a prompt. The screen projects the fixture-tested Rust policy onto each
raw HTTP answer; it does not execute the full SQLite product path.

| Measure | Raw model | Projected opt-in policy |
| --- | ---: | ---: |
| Exact source ASCII identifier | 36/81 | 81/81 |
| Exact numeric-token multiset | 81/81 | 81/81 |
| Inserted identifier and required review | — | 45/81 |
| Structural/HTTP rejection | 0/81 | 0/81 |

Those are **narrow fact checks**, not translation accuracy. Every opt-in
insertion is explicitly review-required. The 81 requests took 235,214 ms wall
time, including startup and sampling; request times summed to 210,622 ms,
median 2,570 ms and nearest-rank p95 3,070 ms (N=81). The response usage totals
were 23,859 prompt tokens and 3,385 completion tokens. On the local Windows
RTX 3070 (8,192 MiB), 47 five-second samples recorded a tracked process
working-set maximum of 2,113,974,272 bytes, private-memory maximum of
1,076,158,464 bytes and device-wide GPU memory maximum of 849 MiB. No sampler
errors occurred. The GPU figure includes other processes and does not establish
model offload or an isolated peak. The runtime log records one 2,048-token slot;
actual backend/offload details were not observable here.

AI source-aware inspection of the 81 repeated-template outputs found that
`我们还需要 3 个箱子` ("we still need three boxes") became `Им также нужно 3
коробки` ("they also need three boxes") at cue 3, seeds 101/202, and cue 1019,
seed 202. The opt-in policy correctly left that wording unchanged while adding
the missing code where applicable. This is retained as [REG-012](../regressions/long-v6-first-person-loss-v1.json),
with same-source related runs and first/third-person negative controls. Cue
1022, seeds 101/202, produced the awkward and potentially unclear
`необходимо перезапускать не нужно` for `不需要重新启动` (no restart needed),
retained as [REG-013](../regressions/long-v6-restart-grammar-v1.json) with
related no-restart and positive-restart controls. These are AI findings for
development triage, not human scores. Model renderings of `工程` vary between
`Инженер`, `Проект`, `Эксперимент` and omission; the approved term and scene
intent are not independently adjudicated. `车` sometimes becomes bus and
sometimes train; the available synthetic scene does not establish a unique
vehicle for every target. The prior cue-129 wrong-content substitution did not
recur in these three requests, but remains an open regression.

The immutable [summary](../reports/2026-09-29-reg009-live-prefix-repair-summary.json)
SHA-256 is `5388be229dae37710322f1143497d48e5e98037437fa11319943d03dd2e51c64`.
The [complete report](../reports/2026-09-29-reg009-live-prefix-repair-report.json),
[81 raw requests/responses](../reports/2026-09-29-reg009-live-prefix-repair-requests.jsonl.gz)
and [resource samples](../reports/2026-09-29-reg009-live-prefix-repair-resources.jsonl.gz)
are pinned inside that summary. `task eval:reg009:live-prefix:capture
REPORT_DIR=.cache/eval/reg009-live-prefix-repair/run-Ca998d` archived the run;
`task eval:reg009:live-prefix:check` verified all 81 raw/accepted pairs,
identities, hashes and review flags. `task eval:regression:check` passed all
versioned packs through REG-013, including the new minimal reproductions and
related/negative controls. `task docs:check`, `task plan:check`, `task site:build`
and `task site:check` passed; desktop and narrow browser views of the new section
were inspected locally. The frozen prompt/source and prior measured screens
remain unchanged.

The existing [GitHub Pages report](https://ermolz69.github.io/auralis-translate/#reg009-live-prefix)
was published from `b3ca1a4` by [workflow run 36579498512](https://github.com/Ermolz69/auralis-translate/actions/runs/36579498512)
with a successful conclusion. The fetched live HTML and committed
`site/index.html` had identical SHA-256
`c92ef7f8627bf71baad047391c16ef659971f4cf5409ffb347f43b90c9656957`.
The live page visibly contained the new section and Tailwind CDN; narrow and
desktop local views were inspected before publication. The old measurements
and open release decision remain displayed.

No model profile, repair policy, Russian quality threshold or release candidate
is selected. The corpus has only eight repeated target templates and no human
Chinese/Russian or licensed natural-scene review. A full 1,024-cue opt-in run,
restart, SQLite/export check, natural long-file comparison, and independent
source-aware reviewer remain open under `CTX-02`, `EVAL-04`, `LONG-03/04` and
G1–G9. The code guard prevents code loss on accepted lines, but it cannot
protect first-person agency, grammatical Russian or an unrelated wrong target.
