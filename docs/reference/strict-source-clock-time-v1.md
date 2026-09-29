# Strict source clock-time policy v1

The checked, opt-in `context_v6_prefix_repair_v3` model profile adds
`strict_source_times: true` to the v2 mixed-script identifier guard. It uses
the existing [clock-time multiset definition](source-clock-time-diagnostic-v1.md)
on each source line and restored candidate after source-prefix projection.
A mismatch returns an invalid candidate before checkpoint commit. The raw
response and restored candidate remain in the inference journal. No automatic
retry or silent correction is introduced. Equal `08:10` and `8:10` pass.

This policy is separate because the established v1/v2 profiles intentionally
accept the candidate with a durable `time_mismatch` warning. Changing those
profiles in place would invalidate their model runs and stored checkpoints.
The new profile requires checked v6 identity, strict source identifiers and
the exclusive v2 prefix repair. Its prompt and model bytes are unchanged;
its manifest bytes and acceptance behavior are distinct.

The parser recognizes only 24-hour `H:MM`/`HH:MM` times. A translated time
zone or an intentional change can be rejected; written-out times and other
numeric facts are outside this rule. The v3 profile remains experimental
until full-file completion, false-positive review and human quality checks
pass. A test fixture proves rejection before persistence; no real long-file
run has used v3.
