# REG-009 opt-in prefix repair: fixture acceptance

Status: checked development implementation, not release selection, 29 September
2026. The [contract](../../docs/reference/source-prefix-repair-v1.md) confines
insertion to one exact source-prefix ASCII identifier and retains a durable
`source_prefix_inserted` review flag. The checked experimental profile SHA-256
is `e80c80b0cf1db26d62ce5f644091f30e42fea752d27a0ce201fcab33f29ecb69`.
The previous strict profile remains byte-identical and still rejects the REG-009
missing-code fixture. Identical fake-server HTTP requests show the repair profile
does not change the prompt, schema or decoding payload.

`task test:source-prefix-repair` passed eight adapter cases, four core diagnostic
cases and one SQLite reopen case. Controls cover exact and absent codes, a missing
code, changed digits, Cyrillic lookalike, duplicate or two source codes, code
outside the first full-width-colon prefix, the exact 80-character boundary and
an overlong prefix. A candidate with a clock time, amount and negation remains
byte-identical after the inserted prefix. Raw HTTP output and the restored
pre-insertion candidate remain in the inference journal; only the validated
line and review flag reach the checkpoint. Core checks reject forged flags and
corrupt resumed text. `task test:context-v6`, `task test:model-profiles`, `task
fmt`, `task lint`, `task docs:check`, `task plan:check`, and `task
eval:reg009:live-prefix:preflight` passed. `task test` first had an isolated
loopback connection refusal in `cli_profile_retry_limit_is_recorded_in_checkpoint`;
the unchanged full workspace rerun passed. This is not evidence of real-model
quality or a reproduced product regression.

The [predeclared real screen](2026-09-29-reg-009-live-prefix-repair-plan.md)
uses 81 identical source-only model requests to compare raw and projected accepted
text. The direct HTTP projection, even if all exact-code checks pass, does not
verify language meaning, product-path persistence on real responses, a full long
file, independent Chinese/Russian review or any G1–G9 release gate. Cue 129's
known wrong-content failure remains a specific semantic risk.
