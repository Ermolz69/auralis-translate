# Predeclared v5 placeholder regression

Frozen before corrected-profile inference on 28 September 2026. Tasks:
`CTX-02`, `EVAL-04`. Development checks only; no human adequacy score.

## Confirmed failure and retained baseline

The first real v5 envelope smoke used 20 authored Chinese lines three times.
All 60 model requests were structurally valid and each file preserved source
bytes, but target IDs `zh08` and `zh19` were accepted as `Русский текст` in
all three repetitions. Their source meanings are an idiomatic demand for a
direct answer and a request to repeat speech over a poor connection. The
candidate copied the example translation text from the prompt; source and
reference were not sent as that answer. This is a confirmed major adequacy
error despite successful JSON validation. Raw prompts, responses, accepted
texts, timings, tokens, resource samples and hashes are preserved in
[`v5-envelope-placeholder-2026-09-28.json`](../reports/v5-envelope-placeholder-2026-09-28.json),
SHA-256 `f55890924ed12e08f14fdef03c74001a420c6ff0857b1e7208d7a6841d2074d3`.
The earlier zero-request readiness timeout remains in ignored local storage
and is described in the [smoke plan](2026-09-28-v5-envelope-smoke-plan.md).

## One correction, scope and budget

The proposed correction removes the example output string from the v5 prompt.
No source-specific replacement or answer lookup is introduced. A mandatory
`prompt_template_sha256` binds the normalized source of the v5 envelope/parser
module to the new profile; the old profile bytes and all old reports remain
unchanged in their evidence. The corrected experimental manifest SHA-256 is
`5ddabfd2757d37da381413ac6062dc0b4395282d5354b5c9ff76800f187630d3`.
Model revision, GGUF SHA, runtime, decoding, 2,048 context size and one-attempt
policy are as in the [first smoke plan](2026-09-28-v5-envelope-smoke-plan.md).

Run `task eval:context:v5:regression` first: three fresh five-cue files, at
most 15 requests and 3,840 configured generated tokens. The authored
[`regression corpus`](../corpora/v5-placeholder-regression-v1.json), SHA-256
`0f34a83d4fdc7b8f217c3be1caa21de698429f705e3dfd18497ae94cc5541e57`,
includes the two observed failures, two new related but differently worded
Chinese cases and an unrelated simple statement. References are AI proposals
excluded from prompts. An exact accepted `Русский текст` is an automatic
failure; source-aware AI inspection of all five meanings follows and is
labelled separately. Stop on first failed file, retaining attempted raw
responses and CLI logs. Do not retry a failed model answer to select a win.

If the five-cue regression is structurally complete, run
`task eval:context:v5:smoke` once on the unchanged 20-cue development set:
three fresh files, at most 60 requests and 15,360 configured generated
tokens. This directly checks the two original IDs in their old positions and
possible regressions elsewhere. Existing v4 output on the same source is a
historical comparison; disclose unpaired dates and lack of human scoring.
The corrected v5 remains a no-context/no-terms control. It cannot pass
`CTX-02`, context benefit or any G gate until scene-bound planning, tokenizer
budget, provenance and reviewed natural data are implemented and measured.
