# V7 target/context salience diagnostic

Date: 2 October 2026. Scope: development diagnostic for `LONG-01` and
`EVAL-04`, following the failed v7 authored batch screen. No release holdout or
independent reviewer is involved. The question is whether the neighboring
ticket-price context caused the model to replace cue 1's meaning, or whether
the same failure occurs without that context.

Use the **exact first chat request** recorded in the retained v7 attempt
`attempt-WUmq4Q` (SHA-256 of private report
`ad6b8505f89b6386a0fca47adcd4570988cb66536aac1f5cefb5853e0f91cebb`,
request SHA-256 `457fa9c51d43fd1c848c9b2e2c135e65890d8ab245499bde79497ee193307e33`).
Keep cue 1, schema, English instruction, decoding settings, response format,
model and runtime unchanged. The sole within-seed factor is `source_context`:
the original cue 2 versus an empty array. Add the same seed to both requests
in a pair. Seeds 101 and 202; counterbalanced order: context/empty for 101,
empty/context for 202. No glossary. This authored source and its Chinese text
are development data, not an eligible natural-media quality sample.

Pinned model: Hy-MT2 1.8B Q4_K_M SHA-256
`dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699`.
Pinned llama.cpp binary: `b10977-0ecb159c9`, SHA-256
`6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`.
V7 manifest SHA-256
`84695e78c6f41abbc0a337e4fa3c0a2df3d7a045d38505fdee8abcf1f6641620`.
Source SHA-256
`ad88b2d2f96b153d5d8880175b321167263d7abaae48ca693d89b925459bc8a7`.
One server, 2048 context, requested 99 GPU layers, one parallel slot, Jinja,
no RAM cache. Use `/apply-template` and `/tokenize` for each request; require
prompt plus 256 response tokens and 64 safety tokens to fit. Compare actual
prompt token count to chat usage. Record request and response bytes, hashes,
HTTP status, token counts, elapsed time, resources, structural status and errors
in an ignored private attempt folder. Public results contain redacted summary.

Maximum four chat requests, eight preflight calls, 90 seconds per chat,
15 seconds per preflight, 120 seconds startup, 10 minutes total including
startup; no automatic retries or parameter changes. Stop on a failed request,
budget violation, model/runtime mismatch or insufficient prompt capacity;
retain the failed attempt. A sandbox process permission failure may be rerun
once with the same frozen protocol after recording it. Run through
`task eval:context:v7:salience:preflight` then
`task eval:context:v7:salience:probe`.

Expected meaning, excluded from prompts: Manager Wang says tomorrow is not
Friday. A rendition of the ticket's ten and one hundred yuan under target
ID 1 is a source/context swap. AI source-aware inspection will classify raw
outputs after the run. External Chinese–Russian review remains zero. Even a
context-free correct rendition on two seeds would support only a local cause
diagnosis; it would not demonstrate long-file quality or release readiness.
