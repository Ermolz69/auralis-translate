# One complete-file 1.8B comparison on the same ASUS subtitles

Date: 30 September 2026. Partial `CTX-02`, `LONG-04`, `EVAL-04` and
`DECIDE-01`. Question: does the pinned Hy-MT2 1.8B v5 scene profile complete
the 268-cue ASUS file that the pinned 7B profile stopped at cue 227? This is
a structural long-file comparison, not a model-quality selection. The
[7B first pass](2026-09-30-commons-asus-full-7b-failure.md) and
[copied-state continuation](2026-09-30-commons-asus-resume-failure.md) remain
immutable baselines. The one-factor model change also changes GGUF/model
revision and expected runtime memory; the scene policy, prompt template,
context size, sampling settings, source, provisional one-video scene map,
CLI and llama.cpp runtime stay fixed. No accepted 7B text or expected Russian
meaning enters the 1.8B requests.

The original Commons ASUS Chinese SRT revision `892592485` has 268 strict
cues, SHA-256
`923aed3991c2308d92b89c45181cea8ec7ece74e9b4d3a3ce0234d95e329913b`.
The matching private 240p media SHA-256 is
`9e4271f8112de2fa65ad67c4cec3390529e916d70363bc5f4c421f4479b97cc1`.
Subtitle/media rights, audible alignment and human review are still
unadmitted; this is development-only source material, not holdout. Source,
media, raw requests, raw responses and any output SRT stay in ignored storage.

Use Hy-MT2-1.8B Q4_K_M GGUF SHA-256
`dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699`,
manifest SHA-256
`432a1b064397a96334d777dfa01a2cef58d367b37023f1f9175501969698df4d`,
llama.cpp runtime SHA-256
`6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`
and release CLI SHA-256
`82df0fbd0167b9163f945c58d8387a1edf2c6eedfed9f38086f617f74914df1d`.
The 1.8B and 7B manifests both use one target per block, one context cue on
each side, 2,048 minimum context tokens, 4,096 maximum context bytes, 64
token safety margin, temperature 0.7, top-p 0.6, top-k 20, repeat penalty
1.05 and 256 maximum output tokens. Run one local GPU server and one new
SQLite state. No seed, retry, alternate prompt or model fallback is allowed.

Run `task eval:natural:asus:1_8b:preflight`, then one
`task eval:natural:asus:1_8b:probe`. Bound the diagnostic at 270 chats,
850 total proxied HTTP calls, 1,200,000 ms model-stage wall time,
130,000 ms per upstream call, 180,000 ms readiness and 600,000 ms model
doctor. The runner records source/model/profile/runtime/CLI identity, every
request and raw response, usage, HTTP/CLI time, sampled working set and
whole-device GPU memory, SQLite state, accepted lines if complete, SRT
structure and offline byte-identical export. On any failure retain the
workspace, prefix and report; do not publish a partial SRT. A zero-model-call
environmental launch failure may get one same-byte rerun after its report is
retained. A model/output failure gets no same-profile retry in this plan.

If it completes, inspect beginning, middle, end, boundary, names, numbers,
negation and cross-cue continuity with source-aware AI triage clearly
separated from unavailable human review. Compare same-source model behavior
and resources without treating the failed 7B wall time as full-file throughput.
No release profile, training or precision decision follows from structural
completion alone. Human bilingual and audio review plus licensed source
admission remain required for `LONG-04` and G1–G9/A1–A6.
