# REG-014 cue-89 decoding screen: retained result

This [predeclared screen](2026-09-29-reg-014-cue89-decoding-plan.md) ran once
on 29 September 2026. The committed runner was `942cea34`; the exact 1.8B
model, runtime, v1 prompt, synthetic source and six ordered request hashes
are in the plan and [summary](../reports/2026-09-29-reg014-cue89-decode-summary.json).
The [compressed archive](../reports/2026-09-29-reg014-cue89-decode-archive.json.gz)
SHA-256 is `2ee73d3a3a66bd0fcf4d787bbbf19b7aac39926f90d89b8da2594f5184bb85d3`.
It retains exact request bodies, all raw HTTP responses, parsed candidates,
token/timing fields, sampled memory and server log. The ignored original
workspace `run-R7T23M` remains. There were six calls, zero retries or errors,
one server, and 15,565 ms total wall time.

| Seed | Temperature 0.7 raw candidate | Temperature 0.0 raw candidate |
| ---: | --- | --- |
| 101 | `Поезд отправится в 08:10.` | `Эксперимент AUR-0089: Поезд отправится в 08:10.` |
| 202 | `Эксперимент AUR-0089: Поезд отправится в 08:10.` | Same as seed 101 at 0.0 |
| 303 | Same as seed 202 at 0.7 | Same as seed 101 at 0.0 |

The source line is `工程 AUR-0089：列车将在 08:10 出发。`; source context was
Chinese cues 88 and 90. No Russian reference, previous answer or review was
in the prompt. All six responses parsed as target slot 89 and kept `08:10`.
Exact raw ASCII code coverage was **2/3 at 0.7** and **3/3 at 0.0**. The
seed-101 temperature-0.7 answer omitted both `AUR-0089` and the source
prefix's meaning. The existing v1/v2 policy would insert the exact source
code with a durable review flag; it would not restore missing meaning. The
historical unseeded real CLI answer used Cyrillic `АРУ-0089` and is a
separate, rejected observation. The 0.0 arm has no varied output across
these three seeds, so this is one-source evidence, not a reliability rate.

Completion tokens were 124 at 0.7 and 135 at 0.0; summed request wall times
were 6,537 and 4,943 ms. The first request had an uncached 305-token prompt,
while later requests reported 304 cached prompt tokens. No arm speed claim
follows. Three samples measured a tracked process working-set peak of
2,106,363,904 bytes and private-memory peak of 1,058,131,968 bytes. The
1,032 MiB GPU value is device-wide; it does not isolate this model.

**AI source-aware review:** `Эксперимент` may misstate `工程` (engineering
work/project) and the omitted-code answer loses this prefix entirely. This
judgment is a triage flag, not a scored Chinese/Russian human review. Human
reference, source-aware reviewer, long natural file and sealed holdout checks
are absent. Neither temperature nor prefix policy is selected for release.

The omitted-code candidate matches the existing REG-014 control and the
provider's durable `source_prefix_inserted` fixture. New controls tried a
different ASCII code and altered clock time. The different code was rejected.
The [REG-016 pack](../regressions/cue89-omitted-code-and-time-guard-v1.json)
pins the raw model omission with four related and three negative controls;
catalog v8 links it to this evidence without changing older catalogs.
The changed time initially failed a new **strict-rejection expectation**
because the established contract deliberately stores a `time_mismatch`
warning. A separately versioned [strict-time policy](../../docs/reference/strict-source-clock-time-v1.md)
now rejects changed, missing or duplicated times before a checkpoint in
fixture tests; v1/v2 remain advisory. This does not prove v3 real-model
completion or meaning preservation.

Checks: `task eval:reg014:decode:preflight`,
`task eval:reg014:decode:probe`, `task eval:reg014:decode:capture`,
`task eval:reg014:decode:check`, `task test:identifier-guard`, and
`task test:time-diagnostics` passed after the new policy. The first
`task test:identifier-guard` run failed on the altered-time expectation and
is retained in the task record; the contract was corrected with a new
profile instead of rewriting the historical profiles. `CTX-02`, `LONG-03`
and `EVAL-04` remain open.
`task eval:regression:catalog:check`, `task eval:regression:check`,
`task test:model-profiles`, `task fmt`, `task lint`, `task docs:check`,
`task plan:check`, `task site:build`, and `task site:check` also passed;
the first sandboxed regression attempt hit Node `spawn EPERM` and the
permissioned rerun passed.
