# Relation warning v2 has no measured second-source coverage

Date: 10 October 2026. The one offline replay in the
[frozen plan](2026-10-10-source-relation-cross-source-plan.md) completed
without a model, ASR, TTS or network request. The unchanged v1/v2 rule
files were checked by SHA-256. All private Chinese/Russian files matched
their pinned hashes; all 794 source/target cue IDs and timing lines matched.
The private attempt record is retained at
`.cache/eval/source-relation-cross-source-v1/attempt-OW9u47/attempt.json`.
The [source-free report](../reports/2026-10-10-source-relation-cross-source-v1.json)
is SHA-256 `d1141b970dd5ee6871024443f98189a4619c141e3c09dd2520acf0f9379bb6b6`.

| Exposed development group | Unique Chinese cues | Saved Russian drafts | Recognized v2 source relations | Warnings |
| --- | ---: | ---: | ---: | ---: |
| Geekerwan ASUS | 268 | one 7B/v8 | 0 | 0 |
| Sethlui restaurant | 263 | 1.8B/v6 and 7B/v6 | 0 | 0 + 0 |

The sources contribute **531 unique cues** and **794 source/target pairs**.
The two Sethlui drafts are correlated observations of one source. The v2
rule recognizes only its narrow Vivo relation constructions here; it never
reached a target-language contradiction check on these two groups. Thus
the zero warning count is **not** a true-negative rate, a precision score,
or evidence that the drafts preserve other facts. Both sources and all
three drafts remain unreviewed. No source text, translation or private
audio was published.

`task eval:source-relations:cross-source:report` ran once after the plan
and harness commit. `task eval:source-relations:cross-source:check` then
independently rehashed and recomputed the complete report. The eleven
applicable deterministic v1/v2/cross-source controls passed, including
timing-mismatch rejection and null precision when no source relation is
recognized. There were no failures or retries.

Decision: retain v2 as an evaluation-only warning for its exposed Vivo
cases; do not promote it into the product or count this as cross-source
validation. The next quality experiment must first define source-derived
fact relations and negative controls from a different exposed source,
then measure both trigger coverage and false warnings on retained output.
Do not loosen v2 merely to produce hits, reuse a sealed holdout, or
call warning absence an approved translation. G3–G5, `EVAL-04`,
`LONG-04` and RELEASE-05 remain open. Rollback is the unchanged v8
product profile and the original v2 evaluation rule/report.
