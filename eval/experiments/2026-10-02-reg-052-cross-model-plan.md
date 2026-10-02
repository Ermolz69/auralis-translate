# REG-052 same-source 1.8B/7B model screen

Date: 2 October 2026. Task: partial `EVAL-04`, not release acceptance.
The preceding [v8 control screen](2026-10-02-reg-052-v8-controls-result.md)
exposed unstable names and `REG-053` payment-verb intrusion. This bounded
screen asks whether the already installed local Hy-MT2 7B Q4_K_M model
behaves differently on the exact same twelve source-and-context requests
as the 1.8B v8 model. It is a model-capability screen; a 7B product v8
profile is not yet defined or approved.

Take only the context-**on** requests for the six frozen REG-052 authored
cases at seeds 101/202 from private
`.cache/eval/reg-052-v8-controls-v1/attempt-uQZQXg/report.json`
(SHA-256 `96ac8d1b1b6c126b3e66052702560ff9b1aca30d0809ac1b59ce0f5a2b161ebf`)
and its `requests.jsonl`. Preserve Chinese target/context text, instruction,
slot ID, response schema, temperature, top-p, top-k, repeat penalty and
seed. Change only the model alias. Keep the same request order. Expected
meanings from `eval/regressions/v8-name-question-controls-v1.json` stay out
of all model requests. Pair by case/seed with the 1.8B raw responses; no
closed holdout is used.

The 1.8B GGUF SHA-256 is
`dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699`.
Pin 7B model repo `tencent/Hy-MT2-7B-GGUF`, revision
`ab8472660ac61fac25f1af43fac2599d52a8a775`, GGUF SHA-256
`9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b`
and installed model identity manifest SHA-256
`e7e2d7745cb283a88984da202eb511f0144b2bc51bc6eb01727515a51e7aa06f`.
That manifest describes the earlier v6 product profile; here it supplies
the pinned 7B file/alias only. Use the same llama.cpp `b10977-0ecb159c9`
binary SHA-256
`6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`.
One 7B server, 2048 context, requested 99 GPU layers, one slot, Jinja and
RAM cache disabled. Render/tokenize each request and require ≤1728 prompt
tokens for 256 response and 64 safety. Record raw requests/responses,
tokenization, completion, elapsed time, errors and sparse resources in
ignored private storage. Retain failures.

Budget: 12 chats, 24 preflights, 120 seconds per chat, 15 seconds per
preflight, 120 seconds readiness, 10 minutes wall; no retry or prompt
search. Stop on infrastructure failure and save the partial attempt.
Run `task eval:regression:cross-model:preflight`, then
`task eval:regression:cross-model:probe`. A 7B improvement on this known
development set would justify only further natural-file tests. Neither
model output is an independent bilingual human review or a final script.
