# One-factor 7B decoding screen for repeated embedded JSON tails

Date: 30 September 2026. Partial tasks: `CTX-02`, `EVAL-04` and `DECIDE-01`.
The same checked 7B v5 profile produced invented JSON-closing syntax inside
target text on [Vivo cue 276](2026-09-30-commons-vivo-full-7b-failure.md)
and [ASUS cue 227](2026-09-30-commons-asus-full-7b-failure.md), then repeated
the ASUS failure on an [identical resumed request](2026-09-30-commons-asus-resume-failure.md).
This screen tests the limited hypothesis that the profile's high sampling
temperature contributes to the structural failure. It is not a proposed
semantic repair, model selection or permission to retry the failed run.

Freeze four exact archived requests: ASUS cues 226 (valid neighbor) and 227
(rejected tail) from report SHA-256
`d86f4264ae1c65f3508c3c8539cdcee3fd4fcae9de1fbc14ee0d83e02bc216ba`,
and Vivo cues 275 (valid neighbor) and 276 (rejected tail) from report SHA-256
`acce4016734648c500a4abeb5ae7619e138d1af46955c50232a39cb450ec59b2`.
The respective Chinese SRT SHA-256 values are
`923aed3991c2308d92b89c45181cea8ec7ece74e9b4d3a3ce0234d95e329913b`
and `8c41e66f52000a5b67ab27bfc319accd11d89290b60e50fc5c60f4ee8230a000`.
Both are private, unadmitted development candidates, not holdout. The harness
will verify each exact baseline request hash before inference, including the
source-only prompt, one target ID, fixed neighboring context and the old
`temperature=0.7` value. It will retain baseline raw-response hashes and all
new raw outputs privately. No expected meaning, Russian reference, previous
translation or holdout enters any prompt.

Use the same GGUF SHA-256
`9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b`,
llama.cpp runtime SHA-256
`6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`,
v5 profile SHA-256
`9b34d86d3b0d872720ee729131efef99281e71a0000d202abea169d625a92e73`
and release CLI SHA-256
`82df0fbd0167b9163f945c58d8387a1edf2c6eedfed9f38086f617f74914df1d`.
The **only changed request field** is `temperature: 0.7` to `temperature: 0`.
Top-p, top-k, repeat penalty, response format, model, prompt, target, context
and token cap remain byte-identical. Make two repetitions per case in the
order ASUS 226/227, Vivo 275/276, repeated. No new seed is added; the
runtime's unspecified random state remains a limitation. Compare exact
strict-SRT admission through the pinned CLI, raw target text, token usage,
HTTP time and sampled process/device memory. Semantic differences get AI
source-aware triage only, separately from human judgment.

Budget: one server start, eight chats, zero retries, 120,000 ms per request,
180,000 ms server readiness and 300,000 ms total wall time. Run `task
eval:natural:json-tail:temperature:preflight` before `task
eval:natural:json-tail:temperature:probe`; stop on a harness/identity failure
and retain all prior attempts. The direct-chat screen creates no durable
translated SRT and cannot be resumed under the old profile identity. Even if
the two failing windows become structurally valid, promote no profile or
full-file claim without a separate versioned manifest, full-file and
source-aware quality comparison, and independent Chinese–Russian review.
