# Frozen 1.8B v6 target-slot full-file ASUS diagnostic

Date: 30 September 2026. Partial `CTX-02`, `LONG-04` and `EVAL-04`.
The [paired natural cue-20 screen](2026-09-30-natural-asus-slot-schema-screen-result.md)
returned target ID 20 in 3/3 constrained-schema requests but left language
quality unreviewed. The question here is whether the already versioned v6
target-constant response schema can translate the complete 268-cue ASUS
source structurally, with all other 1.8B scene and sampling settings held
as in the [failed v5 pass](2026-09-30-commons-asus-full-1_8b-failure.md).
This inspected private Commons source is development material, not sealed
holdout or rights-admitted audio. Neither references nor prior Russian
outputs enter requests.

The source Chinese SRT SHA-256 is
`923aed3991c2308d92b89c45181cea8ec7ece74e9b4d3a3ce0234d95e329913b`;
matching 240p media SHA-256 is
`9e4271f8112de2fa65ad67c4cec3390529e916d70363bc5f4c421f4479b97cc1`.
Use Hy-MT2 1.8B Q4_K_M SHA-256
`dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699`,
llama.cpp executable SHA-256
`6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`
and release CLI SHA-256
`82df0fbd0167b9163f945c58d8387a1edf2c6eedfed9f38086f617f74914df1d`.
The v6 slot manifest SHA-256 is
`b30546f228ba230364ba79edae55456d62e7d7c5010e56fef38464c3531089c5`.
It differs from the v5 scene manifest only in `prompt_version` and
`prompt_template_sha256`; the prompt text and one-target/two-neighbor
selection policy remain the same, and v6 binds the JSON reply's ID and
line index. Profile templates are not mixed within a run.

Run `task eval:natural:asus:v6:preflight` and one
`task eval:natural:asus:v6:probe` only after this plan and harness are
committed. Use one fresh SQLite state and server, 2,048 context tokens,
temperature 0.7, top-p 0.6, top-k 20, repeat penalty 1.05 and 256 maximum
output tokens. Budget 270 chats, 850 proxied HTTP calls, 1,200,000 ms
model-stage wall time, 130,000 ms per upstream call, 180,000 ms readiness
and 600,000 ms model doctor. One run, no same-profile retry, fallback,
reference-led edit or partial SRT publication. A zero-model-call launch
failure may be rerun once after its report is retained.

Retain source/model/manifest/runtime/CLI hashes, raw requests and responses,
accepted text if complete, usage, timings, sampled memory, state and output
checks in a unique ignored private workspace. On failure retain the exact
prefix, report and rejected answer. On structural completion inspect
beginning, middle, end, boundaries, names, numbers, negation and continuity
with AI triage labelled separately from missing bilingual review. A
complete SRT alone cannot promote v6 or satisfy G1–G9, rights, audio or
desktop gates. The older v5 failure and all model comparisons remain
immutable baselines.
