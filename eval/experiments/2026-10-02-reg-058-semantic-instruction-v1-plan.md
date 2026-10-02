# REG-058 source-context semantic instruction screen

Date: 2 October 2026. Experiment ID `reg-058-semantic-instruction-v1`.
This is an authored ASUS development screen, not a holdout, a human quality
rating or a release gate. The owner declined volunteer contact. The original
Chinese subtitle SHA-256 is
`923aed3991c2308d92b89c45181cea8ec7ece74e9b4d3a3ce0234d95e329913b`.
The six natural REG-058 cue failures and their source-only neighboring cues
come from the immutable private v8 report SHA-256
`9ae192177dd51611f49adf7699ca4fe9677a230dc74cbdedded2618040cc193c`.
The established 12 control pack SHA-256 is
`fcba9d337e8bdf3dd0d431cf886917bcefa999a44d9eb30fcc5450a6147ebe09`.
Six additional related controls, frozen before inference, have SHA-256
`8f18dc5cb1fa848df7ca54f3bfba604bb5c04ebd9da54b1dca7c9af1ad9eeda7`.
None of the expected meanings or Russian candidates enter a request.

## Single changed factor

Compare the unchanged production v8 user prompt against the same prompt with
this one source-independent instruction immediately before `Input JSON`:

> For each target, preserve the concrete referent, attributes, relations, negation and conventional action conveyed by the Chinese. Use source_context only to resolve ambiguity. When uncertain, use a faithful general expression rather than substituting a nearby concept.

The instruction bytes, including the trailing space, have SHA-256
`3985d15da5091d5bacd95a86129f2fcf3527cc81732b5c1b283eb465f1a0f7ae`.
This prompt is experimental; the repository's v8 profile is unchanged.
For each control, replace both `source_original` and
`source_for_translation` with the same Chinese text in the exact recorded
single-target request. The target ID, source-only neighbor context, model,
response schema, sampling parameters and token ceiling remain the same.
Baseline/instruction order alternates by control within one server process.
No term is called `approved_terms` without a human approval record.

## Frozen hardware, limits and decision

Run only Hy-MT2 7B Q4_K_M SHA-256
`9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b`,
manifest SHA-256
`a748572cea20fc46c53ced5c39c5b8e3fb85887c2e90d559a27fd41ea818f2bc`
and Windows CUDA `llama-server.exe` SHA-256
`6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`
on the local RTX 3070 (8,192 MiB). Use 18 Chinese controls × two prompt
variants, one sample each: at most 36 chats and 72 template/tokenizer
preflights, 256 response tokens, 2,048 context tokens with 64 safety tokens,
120 seconds per chat, 15 seconds per preflight, three minutes readiness and
20 minutes total wall time. Zero retries and zero prompt/parameter search.
Retain all failures, raw requests/responses, hashes, tokens, elapsed times,
resource samples and exact accepted/rejected structural outcomes. A model
response with leaked JSON in translated text counts as invalid regardless of
outer schema parsing.

Advance this instruction to a *separate* full-file development comparison
only if every response is structurally accepted, the AI-only source-aware
review finds correction of both previously failed multi-core and mouse-pad
positives, and no new material meaning error among the other 16 controls.
If this screen fails, retain it and do not change the product prompt. A pass
would only justify another bounded experiment on the same full 268-cue source
with beginning/middle/end, seam, names, amounts, negations and scene checks;
it would not prove G3–G5. Independent Chinese–Russian review, source rights
and spoken alignment remain open.

Use `task eval:regression:reg058:instruction:preflight` before the single
`task eval:regression:reg058:instruction:probe`. Then use
`task eval:regression:reg058:instruction:report` and `:check` to validate
the private journal and publish a source-free comparison.
