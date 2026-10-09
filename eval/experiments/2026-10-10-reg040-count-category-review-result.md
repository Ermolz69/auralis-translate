# REG-040 count/category warning finds one retained natural error

Date: 10 October 2026. This is the single offline replay authorized by the
[frozen plan](2026-10-10-reg040-count-category-review-plan.md). The
[source-free report](../reports/2026-10-10-reg040-count-category-review-v1.json)
has SHA-256 `cf4967f718ee1d0b1dd4bd940ed315e26ef64421a777ea1680fa8d2e2c11d960`.
The private attempt is retained at
`.cache/eval/reg040-count-category-review-v1/attempt-YAynIX/attempt.json`.
There were no failures or retries.

The 263-cue Chinese restaurant SRT and two complete Russian v6 drafts were
rehash-checked, then all 526 source/target cue identities and timing lines
matched. The source SHA-256 is
`4777e11caa115e893f2328c2a33c25a76c7391ace8ecf0ac4b9436635fc27964`;
the 1.8B and 7B draft SHA-256 values are
`042c0ffffd67a4ea6f562645655ffe9db823866d7505b4ed64708e0ff829df4d`
and `45f140e201f5a6228a0754e48d1e2b4153a392a7869dc279768339882fa53511`.
The rule SHA-256 is
`f840c0adbb84f77823686b5df7a04d91954426dd31b425dfc789a7b5c8717a77`.
Source, raw responses, accepted text and exact cue-35 hashes remain linked in
[REG-040](../regressions/sethlui-source-facts-v1.json) and the private runs.

| Saved draft | Chinese cues with recognized relation | Russian cues with recognized relation | Warnings |
| --- | ---: | ---: | ---: |
| 1.8B/v6 | 1/263 | 1/263 | cue 35: one count/category swap |
| 7B/v6 | 1/263 | 0/263 | 0; the broader wording is outside this rule |

Source cue 35 pairs 30 dim sum dishes with eight desserts. The 1.8B
accepted response pairs 30 desserts with eight appetizers. This is the
previously identified exposed REG-040 error, now caught mechanically.
The authored 18-case development corpus tests correct and reversed category
order, Chinese and Arabic numbers, Russian words and digits, negation,
incomplete/generic answers and unrelated quantities. All decisions passed.
The only natural warning was the known cue 35, individually checked against
its pinned source and accepted response. This is an **AI source-aware
assessment**, with zero independent Chinese–Russian judgments. One known
positive and zero independently adjudicated natural negatives cannot establish
precision or recall. In particular, the unflagged 7B wording is not certified
accurate; lexical abstention is expected.

`task eval:reg040:count-category:preflight` verified hashes, 18 controls,
263 cue IDs and timing lines, and the exact REG-040 reproducer before replay.
`task eval:reg040:count-category:report` captured one bounded replay;
`task eval:reg040:count-category:check` independently recomputed it.
The 20-second wall budget was met. There were zero model, ASR, TTS and network
requests, so no new prompt/completion token or model-memory measurements.

Decision: keep the rule as an **evaluation-only warning** for explicit
count/category reversals. No automatic repair, product admission, model choice
or translation quality pass follows. Product v8, original SRTs, raw replies
and both drafts remain unchanged. A later candidate needs more source families,
negative controls, independent meaning review and a broader warning-coverage
screen before product admission. G3–G5, EVAL-04, LONG-04 and RELEASE-05 stay
open. Rollback is the unchanged v8 product profile; this evaluation rule may
be omitted without changing prior translation runs.
