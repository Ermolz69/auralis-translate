# Frozen REG-085 temporal control screen

Date: 10 October 2026. Partial `CTX-03`/`EVAL-04` development evidence.
Experiment ID: `REG-085-TEMPORAL-CONTROLS-v1`. The source is the six
authored Chinese controls in [REG-085](../regressions/reg-085-retrospective-context-tense-v1.json),
SHA-256 `d89cc593114654ed5ebd6af4be5989b5df834142465e28c135277d217fed94e7`.
They are related and negative development cases, **not** excerpts from the
official PDF, independent professional references or a sealed holdout.

Question: does unchanged Hy-MT2 7B/v8 preserve completed versus future
action when a retrospective/future heading, an explicit time word or no
relevant context accompanies the same policy verb? Run all three related
cases followed by all three negative controls, once each. Preserve the
earlier official-reference v1/v2 responses as a separate baseline; the
source phrases differ, so no sentence-level win rate is claimed.

Reuse the SHA-pinned 7B Q4_K_M weight
`9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b`,
llama-server runtime
`6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`,
v8 manifest `c287c53efbb4ce78471b64648ea3dd2f521363df0e168b7a61df1fdd6ae0479a`
and baseline request template
`b9c0951807157c832c42ec1d8d5ab3ec0ebd8498fa2cb01ccf3ce1f2b65e8210`.
The official PDF hash remains a provenance link to the original REG-085
finding, not a source assertion for these authored lines. The six requests
are frozen before inference with exact request hashes. Only Chinese source
and Chinese context go into the prompt; English expected facts and the
published Russian text are excluded.

Budget: one local server, six chats, twelve template/tokenizer preflights,
12,000 total reported tokens, 120 seconds per chat, ten minutes total,
zero retries and no network, ASR or TTS calls. Save every raw request,
reply, accepted text, token count, duration, resource sample and failure.
Stop if a preflight, validation, budget or source identity fails. Review
each answer against its Chinese source and expected temporal fact as an
**AI assessment** after all raw replies are durable. Do not automatically
change v8 or promote the result to natural subtitle quality, G3–G5 or
RELEASE-05. A later candidate needs paired natural-source controls and a
fresh source group for acceptance. Rollback: omit this evaluation-only run.
