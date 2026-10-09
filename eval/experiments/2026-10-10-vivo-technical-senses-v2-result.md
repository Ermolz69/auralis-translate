# Technical sense v2 paired screen rejected by negated multi-core control

Date: 10 October 2026. Tasks: `CTX-03`, `LONG-04`, `EVAL-04`.
The [precommitted v2 plan](2026-10-10-vivo-technical-senses-v2-plan.md)
and [28-request freeze](2026-10-10-vivo-technical-senses-v2-freeze.json),
SHA-256 `466b0cb47164bd7f8fa2873f6ca318ab1af12724b674737728c8b31ee691f208`,
preceded all inference. The v1 freeze and [REG-075 false-abstention
result](2026-10-10-vivo-technical-senses-v1-preflight-result.md) remain
unchanged. The 467-cue original Chinese file SHA-256 is
`b100803367b95fa55fc638b1ff39a0abfa0d5b8183ebe58d58b1a87242d9d8c4`.
The same pinned 7B Q4_K_M model SHA-256 is
`9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b`,
llama-server SHA-256
`6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`,
and v8 manifest SHA-256
`c287c53efbb4ce78471b64648ea3dd2f521363df0e168b7a61df1fdd6ae0479a`.
The two arms use the same source slots, neighbor context, response schema,
decoding and seed 101. The candidate adds provisional technical senses
only for an affirmative exact target occurrence. Six candidate requests
with negated or absent terms are byte-identical to v8. No expected full
sentence or review rubric was sent to the model.

The first sandbox launch failed on `spawnSync git EPERM` before any model
process or HTTP request. Its empty journal and `launch-failure.json` remain
in private `attempt-sPDmRZ`. With process execution allowed, one actual
model attempt completed in private `attempt-WN2KN8`: **28/28 valid JSON
answers**, 56/56 rendered template/tokenizer preflights, 8,119 combined
tokens, 37,187 ms wall time, zero model retries and zero HTTP/validation
failures. The [public source-free machine report](../reports/2026-10-10-vivo-technical-senses-v2.json),
SHA-256 `2c962bb859e2ffa585853e13370d0eda8bdc597d7ae02d952201fc68df003043`,
pins every source/request/raw-response/accepted-text hash and token/time
record. The raw private journal SHA-256 is
`b9c0951807157c832c42ec1d8d5ab3ec0ebd8498fa2cb01ccf3ce1f2b65e8210`;
the private attempt report SHA-256 is
`4e4516b0ab12639260aef476ff1af5117dbdc1594a0ddace19c309beea83883c`.

| Matched arm | Chats | Prompt tokens | Completion tokens | Summed chat time |
| --- | ---: | ---: | ---: | ---: |
| v8 baseline | 14 | 3,046 | 789 | 13,376 ms |
| Provisional note | 14 | 3,461 | 823 | 14,034 ms |

Seven five-second resource samples had no sampler errors. Maximum sampled
server working set was 5,063,421,952 bytes; maximum **whole-device**
GPU use was 7,323 MiB of 8,192 MiB on the RTX 3070. Other applications
were present, so this is not model-only VRAM or a release resource result.
These short-case latency sums are not a whole-file speed comparison.

The separate [source-aware AI review](../reports/2026-10-10-vivo-technical-senses-v2-ai-review.json)
inspected all 14 pairs and neighboring natural source cues. Two of three
natural technical facts improved: the candidate says CPU cores rather than
multiple processors at cue 172, and the all-big-core architecture rather
than a vague/full-core plan at cue 232. At cue 393, both matched answers
already retained the manufacturing-process concept; the candidate made
it longer. The cue-172 Russian agent grammar remains awkward; cue 232
makes the source's explicit “we” implicit. Five authored related positive
controls retain their main technical facts. No new major candidate fact
error was identified by this AI-only review, but no independent bilingual
reviewer rated any answer.

**The frozen advancement rule failed.** In one of six negative/absence
controls, the Chinese source contrasts three separate chips with an
explicit denial of *multi-core* design. Both baseline and candidate
retain the three chips but instead deny *multi-processor* operation.
The candidate request is byte-identical to v8, so this is a shared
unrepaired error, not a candidate regression. [REG-076](../regressions/reg-076-negated-multicore-v1.json)
pins the raw and accepted hashes plus six new unrun contrast controls.
The other five negative/absence controls retain their primary facts.
An exposed one-seed screen with this failed control cannot shortlist the
term note. No full-file rerun, checkpoint or spoken-script approval follows.
The v8 product profile and both prior full Russian SRT drafts remain
unchanged; this rejected helper lives only in `eval/`. Rollback of use is
simply a fresh unchanged-v8 run, retaining all old failures and raw logs.
