# Frozen natural ASUS target-slot schema screen

Date: 30 September 2026. Partial `CTX-02` and `EVAL-04` development evidence,
motivated by the retained [REG-030 failure](2026-09-30-commons-asus-full-1_8b-failure.md).
The question is whether constraining the JSON Schema to the requested target
ID and line index reduces neighbor-ID errors on the exact natural ASUS cue 20
request. This is an inspected development case, not sealed holdout or a release
quality sample. The prior authored
[schema ablation](2026-09-29-slot-schema-ablation-results.md) was inconclusive.

The archived private report has SHA-256
`5f606c5f3e66acf4c20a162101cede8f95381145fc6c55a5da98dd5c912a066e`;
the original chat request SHA-256 is
`c4fb7132f0ab385aad7d3cef404a9f9fc772169a221d5d492873fffc9378b1c3`.
It targets cue 20, line 0 with context IDs 19 and 21. Source SRT SHA-256 is
`923aed3991c2308d92b89c45181cea8ec7ece74e9b4d3a3ce0234d95e329913b`.
No prior Russian answer or expected meaning enters the requests. Retain
source-aware semantic review as missing; a structurally accepted response
is not automatically a correct translation.

Keep the same Hy-MT2 1.8B Q4_K_M GGUF SHA-256
`dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699`,
v5 profile SHA-256
`432a1b064397a96334d777dfa01a2cef58d367b37023f1f9175501969698df4d`,
llama.cpp executable SHA-256
`6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`
and CLI SHA-256
`82df0fbd0167b9163f945c58d8387a1edf2c6eedfed9f38086f617f74914df1d`.
For seeds 101, 202 and 303, issue a baseline and a constrained-schema arm,
alternating in that order. Each paired request is the archived body plus
the seed; the constrained arm changes only `response_format` properties
`segment_id` and `line_index` to `const:20` and `const:0`. Keep the original
sampling fields, source/context, one server, 2,048 context and one slot.

Add `task eval:natural:asus:slot-schema:preflight` and
`task eval:natural:asus:slot-schema:probe` before inference. Budget exactly
six chats, one run, 120 seconds per request and ten minutes total including
startup. No retry, adaptive seed, prompt edit, answer remapping, checkpoint
or output SRT. Retain every raw request/response, hashes, candidate,
structural status, token usage, timing, failures and sampled memory in a
unique ignored private workspace. Preserve the original failed report. A
pass in this screen cannot promote v6 without broader natural scenes,
semantic review and long-file reliability evidence.
