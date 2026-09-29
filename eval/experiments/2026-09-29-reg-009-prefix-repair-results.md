# REG-009 archived prefix repair result

The [predeclared screen](2026-09-29-reg-009-prefix-repair-plan.md) ran once
against the original 1,024-cue, 1,280-line synthetic **development** archive.
It issued zero model requests and did not change the archived result,
checkpoints or raw responses. The proposed deterministic policy prepended a
single exact source identifier only when the candidate contained no ASCII or
Cyrillic code-like form and the source carried that identifier in a short
full-width-colon prefix. All four related and three negative REG-009 controls
were unchanged.

| Exact-code measure | Archived model output | Proposed repaired text |
| --- | ---: | ---: |
| Lines with exact source identifier multiset | 615 / 1,280 | 1,271 / 1,280 |
| Identifier mismatches | 665 | 9 |
| Lines changed by the proposal | 0 | 656 |

The 656 changes correspond to the archived missing-code category. Eight
Cyrillic lookalikes and one wrong ASCII code remained untouched. Cue 129 is
more serious than a spelling issue: the Chinese source says the train departs
at 08:10, while the saved Russian candidate says not to open a door. The
proposed policy correctly refused to alter that candidate, but neither the
baseline nor this repair has passed a meaning review. No new inference,
human judgment or natural subtitle source was involved. The measured result
therefore does **not** justify selecting this as a product repair or closing
`CTX-02`, `LONG-03`, `EVAL-04` or a release gate.

The [full line-by-line screen](../reports/2026-09-29-reg-009-prefix-repair-screen.json)
has SHA-256
`067976f39636b873c217890685231e5a9834f6523c68f7954324e3c606b48211`.
It pins the source report, model/profile identities, every archived candidate,
proposed text, reason, controls, 17 ms wall time and 45,572,096 process RSS
bytes. `task eval:reg009:prefix-repair:probe` exited 0. Future runs should use
`task eval:reg009:prefix-repair:check` to verify this frozen observation
without overwriting its timing and memory measurement. Product admission
would require a separate versioned profile, raw-versus-repaired attempt
journal, exact-line validation, matched live-model and natural-source tests,
and independent Chinese/Russian review.
