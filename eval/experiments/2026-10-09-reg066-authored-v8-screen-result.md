# REG-066 authored v8 controls: short facts mostly survive, natural faults remain

Date: 9 October 2026. The [plan](2026-10-09-reg066-authored-v8-screen-plan.md),
[20 frozen request identities](2026-10-09-reg066-authored-v8-screen-freeze.json)
and Taskfile harness were committed at `8fda73b` before inference. The
[REG-066 pack](../regressions/reg-066-vivo-v8-cross-model-facts-v1.json)
contains five related and five negative **authored development** cases;
none is a sealed holdout. One v8 response per case was requested from each
of the pinned 1.8B and 7B models. The Chinese targets occupied rotated slots
in otherwise neutral four-slot batches; a team fact spanned two target cues.
Russian expected meanings remained outside every prompt.

The complete private `attempt-LDeHdv/report.json` SHA-256 is
`13ad5dba7d6f7811c5989ba0d66e32747af55603d61f0b2300d7f72f04476f9a`;
its durable raw request/response journal SHA-256 is
`7ba723de6d16b771e7e3046e96df209025eace21c8a2c4d6a8316bf395d889ba`.
The [source-free machine report](../reports/2026-10-09-reg066-authored-v8-screen.json)
SHA-256 is
`ac02b59ed3da899c6f253c21ee00106fa6c615615457487a41916ddbf489154d`.
The separate [source-aware AI review](../reports/2026-10-09-reg066-authored-v8-screen-ai-review.json)
SHA-256 is
`99df8aaa4cb7f967d3d07e1a764182fbd5d305b302b152f8b8371f0a29e50c40`.
No human language score is present.

| Observation | 1.8B v8 | 7B v8 |
| --- | ---: | ---: |
| Structurally valid chats / planned | 10/10 | 10/10 |
| Apply-template/tokenize preflights | 20/20 | 20/20 |
| AI-triaged fact preserved / needs review / major error | 8 / 2 / 0 | 8 / 2 / 0 |
| AI-noted awkward Russian focus outputs | 5 | 2 |
| Sampled tracked process working set | 1,543,311,360 B | 5,060,780,032 B |
| Sampled whole-device GPU maximum | 4,131 MiB | 7,346 MiB |

Across both models the 20 chats used 7,336 prompt and 2,643 completion
tokens and took 76,460 ms including model loads and checks. Resource samples
are sparse; whole-device GPU use includes other processes. One seed and one
reply per case cannot establish a success probability.

The related controls retained 9400 without an invented first generation, a
jointly committed thousand-person team without replacing it by money, work
until 02:00–03:00, and hoped-for future products. The 36-month wording in
both models needs review: 1.8B omitted a clear anchor, while 7B introduced
“before the start of work.” The five negative controls retained an explicit
first generation, 36 months **after** start, both yuan and people, and
products already on sale. Both 23:00–00:00 outputs need review because the
Russian range or midnight wording is ambiguous. Several 1.8B outputs have
Russian agreement/case errors even when the fact survives.

These short authored cases **do not repair** the full 467-cue Vivo drafts.
Both natural outputs still contain the [paired REG-066 fact risks](../regressions/reg-066-vivo-v8-cross-model-facts-v1.json)
around fragmented planning, workforce, late-night work and future products.
The contrast between simple controls and the natural file points to source
fragmentation and scene/batch placement as the next hypothesis; that is an
inference, not a proven cause. The next bounded screen should keep model,
source facts and v8 prompt fixed while shifting natural cue boundaries or
adding only source-derived typed facts, and include all five negative controls.
No prompt/product candidate was promoted, no full-file rerun was justified,
and G3–G5, the Auralis voice gates and RELEASE-05 remain open.
