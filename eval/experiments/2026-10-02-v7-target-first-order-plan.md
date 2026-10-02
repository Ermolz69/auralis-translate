# Bounded v7 target-first order screen

Date: 2 October 2026. Task: partial `LONG-01` and `EVAL-04`. Prior
[paired diagnostic](2026-10-02-v7-context-salience-result.md) found that this
model translated a neighboring context cue under the correct target ID twice.
This new authored development experiment asks whether placing `target_slots`
before `source_context` in the input JSON reduces that substitution while
retaining the same neighboring Chinese information. It is a prompt-order
diagnostic, not a selected production profile or release holdout.

Cases: `eval/corpora/v7-target-first-controls-v1.json` (SHA-256
`9fbd7075ea490c13e674677d483a7ad68bd0d9abb90d9adccc936f621ae9e7a9`),
three authored pairs:
the known Wang/Friday versus ticket-money leak; an unseen nonmoney target
about Doctor Chen and no rain versus a sleeping cat; a return-key target with
a preceding borrowed-key scene. This last case tests whether swapping
"returned" for "borrowed" or losing the key/manager relationship occurs.
Expected meanings are stated here for later source-aware AI inspection and
**must not enter requests**. The fixture contains Chinese sources only.

The baseline request is the first v7 chat in retained
`.cache/eval/v7-authored-batch-v1/attempt-WUmq4Q/report.json`, whose SHA-256
is `ad6b8505f89b6386a0fca47adcd4570988cb66536aac1f5cefb5853e0f91cebb`;
request SHA-256
`457fa9c51d43fd1c848c9b2e2c135e65890d8ab245499bde79497ee193307e33`.
Keep its instruction, target ID, response schema, decoding, alias, model,
runtime, source-only context shape, timing metadata and lack of glossary.
Replace only the Chinese source strings per authored control. Within each
case/seed, compare the existing JSON key order
`schema_version,source_context,target_slots` against
`schema_version,target_slots,source_context`. All field values remain equal.
This order identity is experimental `v7-target-first-order-v1`; the product
v7 profile is unchanged. Seeds 101 and 202, with baseline/target-first order
for seed 101 and target-first/baseline order for seed 202 on one server.

Pin the same Hy-MT2 1.8B Q4_K_M GGUF SHA-256
`dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699`,
llama.cpp `b10977-0ecb159c9` binary SHA-256
`6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`,
v7 manifest SHA-256
`84695e78c6f41abbc0a337e4fa3c0a2df3d7a045d38505fdee8abcf1f6641620`.
Server: 2048 context, requested 99 GPU layers, one slot, Jinja, RAM cache
disabled. Render and tokenize every actual request before chat. Require
prompt ≤ 1728 tokens (256 response plus 64 safety), and compare tokenizer
count to chat usage. Record raw requests/responses, structural outcomes,
tokens, elapsed times, cache usage, process/device samples, errors, all
attempts and hashes in ignored private storage. Public report is redacted.

Maximum 12 chats, 24 preflight calls, 90 seconds per chat, 15 seconds per
preflight, 120 seconds readiness, 10 minutes overall; no model retry or
parameter search. Stop on infrastructure/preflight failure and preserve the
partial record. Semantic errors remain observed outcomes; do not discard
the paired arm. A sandbox process-spawn failure may be repeated once with
the same frozen configuration after retention. Run
`task eval:context:v7:target-first:preflight`, then
`task eval:context:v7:target-first:probe`.

No independent Chinese–Russian reviewer or listener is available. A reduction
on three known development pairs would justify only an opt-in versioned
implementation and broader unseen controls, not long-file acceptance. If
target-first produces the same or new swaps, retain the negative result and
revise the hypothesis before more experiments.
