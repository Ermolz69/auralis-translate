# Strict source identifier guard v1

Status: experimental candidate after the [REG-009 negative prompt screen](../../eval/experiments/2026-09-29-reg-009-prompt-screen-results.md).
The same 1.8B model omitted codes in 6/8 target slots under either prompt
arm. A simple instruction has no measured gain. This guard prevents an exact
code mismatch from becoming a committed checkpoint or completed subtitle; it
does not improve the model's Russian text.

The guard uses the [v1 identifier grammar](source-identifier-diagnostic-v1.md)
after JSON slot validation and protected money-token restoration. For every
source target line, compare exact ASCII identifier multisets with the restored
candidate. Missing, altered, extra or duplicate codes fail with a permanent
`invalid_candidate` outcome. The inference journal retains the rendered
request, raw response, restored candidate when available, and rejection
reason. No automatic language retry is added. Earlier committed blocks remain
durable; an exhausted run is recoverable and publishes no partial output.
Input from neighboring context never contributes an expected identifier.

Opt in only through a separate checked v6 manifest with
`strict_source_identifiers: true`. The profile file's SHA-256 is part of the
run identity, so it cannot resume an old advisory run. Older manifests default
to advisory behavior and retain their bytes, prompt template, checkpoints and
results. This field is refused on older prompt versions or unchecked runtime
profiles. An exact identifier match is only one narrow fact check; source
names, numbers, negation, fluency, scene coherence and human review still
need their own gates. Because the measured 1.8B output often drops codes,
this guard is a safety candidate, not a selected long-file profile.

The new 1.8B candidate manifest is
[`hy_mt2_1_8b_q4_k_m.context_v6_identifier_guard.experimental.json`](../../models/manifests/hy_mt2_1_8b_q4_k_m.context_v6_identifier_guard.experimental.json),
SHA-256 `e8ec9d8c8919141700e66ac6e6acc5f408ab5a96899566869cbfe0d2ea3d91e9`.
It retains the v6 prompt-template hash and changes only the strict admission
flag. `task test:identifier-guard` uses a local HTTP fixture for the exact
REG-009 omission, wrong digits, Cyrillic lookalike and a correct-code control;
it checks checkpoint count and raw/restored journal outcomes. It is not a
real-model quality measurement.
