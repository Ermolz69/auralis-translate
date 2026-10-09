# REG-076 scoped negated multi-core screen v3

Date: 10 October 2026. Tasks: `CTX-03`, `EVAL-04`, `LONG-04`.
The [v2 paired screen](2026-10-10-vivo-technical-senses-v2-result.md)
retains a shared error: the Chinese source denies a multi-core claim, while
both v8 and the v2 candidate deny multi-processor operation. The v2
candidate is rejected. This v3 screen tests one source-scoped addition to
the v2 request helper; it does not change product v8 or old evidence.

Use the same pinned 467-cue original Chinese SRT SHA-256
`b100803367b95fa55fc638b1ff39a0abfa0d5b8183ebe58d58b1a87242d9d8c4`,
7B Q4_K_M model SHA-256
`9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b`,
llama-server SHA-256
`6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`,
and v8 manifest SHA-256
`c287c53efbb4ce78471b64648ea3dd2f521363df0e168b7a61df1fdd6ae0479a`.
Pin the prior v2 freeze and the immutable
[REG-076 control pack](../regressions/reg-076-negated-multicore-v1.json)
before inference. Inspect current memory and installed assets at preflight.
All inputs are exposed development material, not sealed holdout.

The baseline is the exact v8 target request. The candidate uses the v2
technical sense note for affirmative target occurrences. For a target
source that explicitly negates `多核`, add only a target-scoped note:
`多核` concerns cores within a chip/CPU; retain the source's negation of
that concept and keep distinct chips/processors separate. Do not force
an assertion about processor count that the source does not make.
Exclude quoted mentions, absent terms and negation of `多处理器` rather
than `多核`. No expected Russian sentence, rubric or reference is sent
to the model. The request for excluded targets must be byte-identical to
v8, and every unchanged v2 case must keep its archived seed-101 request.

Use the 14 v2 cases plus the six new REG-076 related/negative controls:
20 cases, both arms, seeds 101/202/303, paired within each seed and
counterbalanced arm order. Freeze all 120 exact request hashes and
context inventories before model inference. Budget: one server start,
zero retries, at most 120 chats, 240 rendered template/tokenizer
preflights, 120,000 combined tokens, 2,048 context tokens, 1,024 response
tokens and 64 safety tokens, 120 seconds per chat, 30 seconds per
preflight, 12 minutes wall time. Keep temperature, top-p, offload,
thread/slot settings and source/context bytes matched between arms.
Record every raw attempt, validation, token count, time, error and
sampled memory; stop and retain the failed attempt on a limit or invalid
response. Do not run TTS/ASR or another model workload concurrently.

Review each paired answer against the source and its neighbors, separating
AI observations from human scores. A candidate may only be shortlisted for
a later cross-source and long-file screen if the original REG-076 meaning
is repaired in all three repeats, the six new controls preserve their
stated facts in all repeats, at least two of three natural technical
facts improve without a new major error, and the remaining prior
positive/negative cases retain their required facts. Otherwise reject
and keep v8. Even a shortlist does not satisfy G3–G5 or approve a spoken
script. All failed attempts and old reports remain available.
