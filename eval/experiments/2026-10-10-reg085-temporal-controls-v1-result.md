# REG-085 authored temporal controls: explicit markers help, heading-only case remains uncertain

Date: 10 October 2026. The [plan](2026-10-10-reg085-temporal-controls-v1-plan.md)
and six exact [Chinese-only requests](2026-10-10-official-zh-ru-reference-v3-freeze.json)
were committed at `4902926` before inference. This screen reuses unchanged
Hy-MT2 7B/v8. The controls are authored development examples, not an
independent official Chinese–Russian subtitle pair or a closed holdout.

The one bounded run returned **6/6 structurally valid replies**, 12
template/tokenizer preflights and 1,744 reported tokens in 13,491 ms wall
time. Summed chat time was 5,955 ms. Two process samples put tracked
working-set peak at 5,059,878,912 bytes; this is not a device-exclusive
memory peak. No retries, new TTS, ASR or network requests occurred.

The immutable private attempt is
`.cache/eval/official-zh-ru-reference-2026/attempt-v3-cCX12t/`.
Raw journal SHA-256:
`b89ffdebe24a28c69b833e4d7904acb086f0960ffb00a062ea8f9b3fcc8d45f7`;
attempt report:
`2a173d3f56ebdb88be2ebdde205da63378397407d1f726e0ee6bfd10b8669e44`.
The [source-free machine report](../reports/2026-10-10-reg085-temporal-controls-v1.json)
pins each input/output hash, token count, time and model/runtime identity;
SHA-256 `f3b72032716dee53dd72bb5212168efa5157551797f6cd1585243e1a42c65728`.
The [separate AI review](../reports/2026-10-10-reg085-temporal-controls-v1-ai-review.json)
contains each accepted Russian output, including the rejected and uncertain
wording; SHA-256 `2cefc5d00a73a215cb11c0d517377d4f74bf77274bfa0007f2501cadaf76099e`.

| Chinese temporal signal | AI reading of saved Russian answer |
| --- | --- |
| Retrospective heading plus completed `了` | Past action preserved. |
| Explicit `去年` | Past action preserved. |
| Retrospective heading with copular `第一项措施是实施` | Answer uses present `является`; severity uncertain because the source line lacks a completion marker. |
| Future-task heading with the same policy verb | Future/prescriptive status preserved. |
| Explicit `明年将` under a retrospective heading | Future status preserved. |
| Unrelated heading and unmarked policy action | No past action invented. |

This is **five clear temporal matches and one uncertain case in an AI
reading**, not a human score or a general accuracy percentage. The official
PDF sentence from [the preceding screen](2026-10-10-official-zh-ru-reference-v2-result.md)
still has a confirmed AI-identified retrospective-to-prescriptive drift:
these authored controls did not retranslate or fix it. Explicit completion
markers make past status easier for v8; section-heading dependence needs
natural published-reference examples before a targeted candidate. No new
high-confidence error was declared from the ambiguous third control, so
there is no new regression ID or prompt change. Product v8 and all long SRT
results remain unchanged.

`task eval:regression:reg085:freeze`, `preflight`, `probe`, `report` and
`screen:check` passed. The first four include a single real-model run; the
last check rehashes all six raw replies and the AI review without calling
the model. `task eval:regression:catalog:v62:build`/`check`,
`task eval:regression:catalog:portable:check`, `task plan:check`,
`task docs:check`, `task site:build` and `task site:check` also passed.
These prove report identity and publication build, not semantic adequacy.
G3–G5 and RELEASE-05 stay open. Rollback is to omit this
evaluation-only run while retaining its raw journal and prior baselines.
