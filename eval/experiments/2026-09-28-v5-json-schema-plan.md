# Predeclared v5 schema-constrained response attempt

Frozen before this variant's inference on 28 September 2026. This is a bounded
`CTX-02`/`EVAL-04` development experiment, not a release or language score.

The original v5 prompt included `Russian text` as an example; the real model
copied it into two unrelated target slots in all three repetitions. The
[retained 60-request report](../reports/v5-envelope-placeholder-2026-09-28.json)
is the immutable failed baseline. Removing the example produced a different
one-request failure: the model returned a `target_slots` object with a
`translated_text` field rather than the declared `translations` response.
The adapter rejected it before any checkpoint. Preserve that raw response in
[`v5-envelope-no-example-failure-2026-09-28.json`](../reports/v5-envelope-no-example-failure-2026-09-28.json),
SHA-256 `cf1f73c0e27e2c33a709181e4e24ffc5a06f9a46d4743ca7937068fbbe2f056d`.

The [llama.cpp server documentation](https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md)
describes `response_format` with `type: json_object` and a JSON schema. This
variant adds that request field with a one-entry `translations` array schema;
the source target, no-example prompt, model, decoding, one-attempt policy,
source corpus and strict adapter validation remain the same. Server support
must be observed on the pinned runtime; documentation for another build is
not evidence of it. The corrected manifest SHA-256 is
`df15d3e4672438a3181e9c97c582660485677c649885988ed5a9dce33119b3a7`.
Its `prompt_template_sha256` binds the normalized v5 render/parser/schema
source. The GGUF SHA and dataset hashes are in the [first plan](2026-09-28-v5-envelope-smoke-plan.md)
and [regression plan](2026-09-28-v5-placeholder-regression-plan.md).

First repeat the frozen five-cue regression once with three fresh file states,
at most 15 model requests and 3,840 configured generated tokens. Stop at any
rejected candidate or accepted exact `Русский текст`; retain the raw result
even if this fails. If it passes structure and the known placeholder check,
inspect the five source meanings as AI editorial findings, then repeat the
unchanged 20-line development smoke once, at most 60 requests and 15,360
configured generated tokens. Both Taskfile tasks retain prompts, raw/accepted
texts, token usage, timings, hashes, resource samples and failed attempts.
Neither a constrained JSON shape nor an AI reading proves bilingual quality.
