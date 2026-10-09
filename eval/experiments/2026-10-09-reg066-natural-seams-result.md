# REG-066 natural seam screen: one time repair, new output failures

Date: 9 October 2026. The [plan](2026-10-09-reg066-natural-seams-plan.md),
[30 frozen request identities](2026-10-09-reg066-natural-seams-freeze.json)
and Taskfile harness were committed at `8e47352` before any model calls.
The same original-platform Vivo SRT, v8 prompt, Q4_K_M models and seed 101
were used for both target placements. This is known development source, not a
holdout, human review or admitted release material. The prior 467-cue drafts
and source were not changed.

The complete private report SHA-256 is
`230c09a7b6aec5c91120f022ee5ed1bd74a20f12269b5db46e0da798c258dc6b`;
its raw HTTP request/response journal SHA-256 is
`fcea60a832f1a7f1d37b2f97e5ce048642f9825d11227a24fadbac49e10a0e2a`.
The [source-free machine report](../reports/2026-10-09-reg066-natural-seams.json)
SHA-256 is
`91399791c61f9daa8fc3f6e1adc9457871f86a7ea5641179524209b7f3dbb6ef`.
The separate [source-aware AI triage](../reports/2026-10-09-reg066-natural-seams-ai-review.json)
is explicitly not a human rating. Every natural arm and negative control is
linked by exact request/prompt/raw response hash, source cue and model.

| Observation | 1.8B v8 | 7B v8 |
| --- | ---: | ---: |
| Planned/actual chats | 15/15 | 15/15 |
| Apply-template/tokenize preflights | 30/30 | 30/30 |
| Structurally valid replies | 14/15 | 14/15 |
| Shifted final reply omitted cue 467 | 1 | 1 |
| Negative controls structurally valid | 5/5 | 5/5 |
| Maximum sampled server working set | 1,588,445,184 B | 5,062,586,368 B |
| Maximum sampled whole-device GPU | 4,045 MiB | 7,359 MiB |

The 30 chats used 16,757 prompt-plus-completion tokens in 119,497 ms overall,
including model loads and preflights. Samples are sparse; GPU totals include
other programs. One seed and reply per arm cannot estimate a success rate.

The 7B shifted cue 328 says one or two at night, correcting its original
eleven-or-twelve-at-night error **in this single reply**. Its 36-month
planning still invents an earlier stage, the thousand-person team still has
financial investment added, and the future product is still presented as
already available. The 1.8B shifted cue 60 introduces the French word
“génération” into Russian where the original placement did not. Both models
returned only IDs 464–466 for a shifted four-target final group 464–467;
the validator rejected the entire reply. The five unchanged negative
controls per model preserved their explicit contrast facts under AI triage,
though late-evening Russian clock wording remains awkward.

The original and shifted target windows have identical Chinese cue bytes,
IDs and timestamps; only the assignment of target versus one-cue context
changes. These observations show sensitivity to placement, not a proven
causal mechanism. The end omission also makes the shifted plan less reliable.
Keep v8 unchanged and reject this blanket shift. [REG-067](../regressions/reg-067-vivo-shifted-tail-id-omission-v1.json)
pins the two omitted IDs; [REG-068](../regressions/reg-068-vivo-shifted-mixed-script-v1.json)
pins the mixed-script recurrence with new controls. None of their authored
follow-up controls has been run yet.

`task eval:regression:reg066:seams:report` and
`task eval:regression:reg066:seams:check` verify raw identity, tokenized
prompts, all 30 outputs and both invalid replies. Independent Chinese–Russian
ratings remain zero; source rights and manual speech alignment are open.
The full-file translation, Auralis spoken script and RELEASE-05 remain
unapproved. Next compare a *source-derived fact guard* only after freezing
its extraction rules and negatives; use an admission rule requiring no new
major errors, no dropped IDs and no cross-cue fact leakage. Do not overwrite
the original file, old model outputs or failed attempts.
