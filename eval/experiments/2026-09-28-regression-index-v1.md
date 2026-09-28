# Permanent regression index v1: prompt-copy failure

Status: initial `EVAL-04` slice, 28 September 2026. The index is a development
check, not a Chinese language or release score.

[`REG-001`](../regressions/index-v1.json) records the v5 example-output copy
as one root cause seen on two source IDs. It pins the failed profile/report
SHA-256, the corrected profile, the raw corrected reports and the source-aware
expected invariant. The earlier failure occurred in all six observations on
the two IDs. The corrected schema profile did not repeat the literal in the
same two IDs, two newly authored related cases or an unrelated negative
control across three runs. Semantic adequacy of those outputs remains open.

`task eval:regression:check` passed four tests and the evidence checker. It
rejects duplicate IDs, missing or overlapping related/negative controls,
changed report hashes, fabricated accepted results and reference leakage from
the model-input projection. The linked Rust `task test:context-v5` also passed
a new source-instruction test: a Chinese target asking for `segment_id 999`
cannot override the declared slot ID 2. This is an adapter boundary check;
it does not prove that a model ignores every source instruction semantically.

The index currently has one confirmed root cause. AI editorial findings on
count, deadline, proper-name and idiom meaning in the corrected v5 report are
retained in the [v5 evidence](2026-09-28-v5-envelope-evidence.md) and still
need bilingual adjudication and source-linked related controls before a
language score. `EVAL-04` remains in progress: generative document coverage,
metamorphic seam/source checks, a broader bug index and change-triggered
real-model tiers are not complete.
