# REG-009 checked long CLI attempt: retained cue-89 failure

Status: failed single 1,024-cue synthetic engineering attempt, 29 September
2026. The [plan](2026-09-29-reg-009-long-cli-soak-plan.md) and runner were
committed at `923fc6d` before inference. An earlier preflight attempt exposed
a mistyped fixture SHA and stopped before model start; the typo was corrected
before that commit. The committed `task eval:cli:long:v6:prefix-repair:probe`
passed all source/model/runtime/profile checks, affected tests, release build
and `doctor` before starting the one planned run. No second clean model run was
launched after the failure.

The same project-authored 1,024-cue, 1,280-line synthetic SRT used by the
[prior v6 baseline](2026-09-29-long-v6-postlength-results.md) had SHA-256
`e9b760bdcce97de9f29f5fe671dbb927088f5a15119ebe3200e73e0408391bb3`.
The checked 1.8B Q4 GGUF was
`dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699`,
llama-server was
`6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`,
opt-in profile was
`e80c80b0cf1db26d62ce5f644091f30e42fea752d27a0ce201fcab33f29ecb69`,
and compiled CLI was
`2daddd91d14a2bf96ab9cd43d42309f197e0b1a0ccb03420f8d2d05ead6f3900`.
The full [archived summary](../reports/2026-09-29-reg009-long-cli-prefix-repair-summary.json)
pins these identities and the private run ID. The [compressed archive](../reports/2026-09-29-reg009-long-cli-prefix-repair-archive.json.gz)
retains all raw prompt/response bytes, restored candidates, checkpoint data,
resource samples and CLI/server logs. Its SHA-256 is
`752173e81de4084d7a548734622fa4477b3909dc882cb918f4b1082b132761bd`.

The CLI was intentionally stopped after 16 durable blocks. It retained the
checkpoint prefix and exposed no partial result or SRT. A fresh server and
compatible CLI resumed and reached 88/1,024 checkpoints before rejecting cue
89, line 0. Across both attempts SQLite retained 334 requests: 112 accepted
template preflights, 111 tokenization preflights, 110 validated chat lines and
one invalid chat line. The 88 saved cues contain 110 text slots; 73 had the
`source_prefix_inserted` review flag and 37 had an exact raw code. These are
structural counts for the observed prefix, not full-file quality or a paired
rate against the complete earlier baseline.

The source line was `工程 AUR-0089：列车将在 08:10 出发。`; the restored model candidate
was `АРУ-0089: Поезд отправится в 08:10.`. The Cyrillic `АРУ` is not the source
ASCII `AUR`; preserving the time does not repair the identifier. The opt-in
policy correctly refused to insert another code over a Cyrillic code-like
candidate. The raw request SHA-256 is
`530ad579a144c55908b02af8a994daa6169dc170a03ba9551c23df8fb15c7231`
and raw response SHA-256 is
`76013d01fe1a109d63c5d206e23b012dafb7af69b62c736292d53b380680024f`.
The new [REG-014 pack](../regressions/long-v6-cyrillic-code-transposition-v1.json)
retains this minimal real failure, four related changed/Cyrillic/duplicate
code controls and three valid or safely repaired negatives. It remains open
as model fact-preservation work; the strict rejection itself is expected.

The failed run has **zero persisted results and no published SRT**. The first
capture summary incorrectly wrote `no_partial_publication: false` because its
generic code required a success-only report. That summary and its hash remain
unchanged. A separate [capture correction](../reports/2026-09-29-reg009-long-cli-prefix-repair-capture-correction.json)
records the prior values and verifies zero SQLite results plus absent output;
the archive checker verifies both records. Later captures derive this field
from failed-run SQLite and output state.

The chat requests used 32,934 recorded prompt tokens and 4,569 completion
tokens, with 278,716 ms summed HTTP time, p50 2,486 ms and nearest-rank p95
3,112 ms (N=111). The full attempt ran from 14:20:07 to 14:25:47 UTC,
including two server starts and recovery. Sixty-eight five-second samples had
zero sampler errors; tracked process working-set peak was 2,129,367,040 bytes,
private-memory peak 1,073,975,296 bytes and device-wide GPU-memory peak 1,037
MiB. The GPU reading includes other processes and does not measure actual
model offload. No natural subtitle, middle/seam/end coverage, human source-aware
score, clean-machine result or accepted long-file quality follows from this
prefix-only failed run. The model also produced `Пожалуйста, сохраните этот
записей` at cue 88 line 1, a separate AI-observed Russian grammar defect.

Checks: `task eval:cli:long:v6:prefix-repair:preflight` passed before inference;
`task eval:cli:long:v6:prefix-repair:capture`,
`task eval:cli:long:v6:prefix-repair:capture:correct` and
`task eval:cli:long:v6:prefix-repair:check` verified retained failure and
capture correction. `task test:source-prefix-repair` passed 9 adapter, 4 core,
1 SQLite and 1 CLI case. `task eval:regression:catalog:check` and the full
`task eval:regression:check` passed through REG-014. The first full regression
invocation hit a sandbox-only Node child-process `spawn EPERM`; the permitted
rerun passed. `task docs:check` and `task plan:check` passed. `CTX-02`,
`LONG-03`, `EVAL-04` and G1–G9 remain open;
this profile is not selected for release. A controlled same-request retry
screen may inform a separately versioned resilience policy, but cannot use a
reference translation to choose a lucky sample.
