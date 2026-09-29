# Frozen v5 long-scene recovery probe

Status: predeclared engineering experiment, 29 September 2026, before any
model-backed attempt. Task IDs: `CTX-02`, `LONG-01` and `LONG-03` (partial
engineering evidence only). It does not test natural subtitle quality, a
sealed holdout, a human reference, or the 4,096/10,000-cue soak gates.

Question: can the existing v5 source-scene CLI translate one complete
1,024-cue SRT with actual tokenizer preflight, persist every target exactly
once, survive a forced process kill after at least 16 saved blocks, reject a
changed profile, and resume with unchanged checkpoint prefix and original
bytes? The run uses a fresh model server after interruption and verifies an
offline byte-exact export. Record the first, middle, scene-seam and last cue
outputs for later source-aware review; this harness makes structural claims
only.

The sole input is project-authored `eval/fixtures/long-file-v1.json`, SHA-256
`0527cab3c4ea38aa91ae65c6f4e52103d7e0c5cde1ab778dc7e9da1a46c43986`.
It generates 1,024 SRT cues and 1,280 text slots. Scene ends are cue IDs
128, 256, 384, 512, 640, 768, 896 and 1024. Source and draft Russian
reference are retained separately; the reference never enters inference.
The fixture group is development only, and its repeated sentence templates
make it unsuitable for translation accuracy estimates. No terminology
glossary or speaker attribution is supplied.

Run the pinned Hy-MT2 1.8B Q4_K_M revision
`a0c709d9fac510f2c807aa3af52872340dc37a4a` (GGUF SHA-256
`dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699`)
with v5 scene profile SHA-256
`432a1b064397a96334d777dfa01a2cef58d367b37023f1f9175501969698df4d`.
The profile specifies 2,048 context tokens, one target cue per durable block,
one previous and one next source cue within each scene, 64 token safety
margin, temperature 0.7, top-p 0.6, top-k 20, and 256 maximum output tokens
per text line. llama.cpp build `b10977-0ecb159c9` executable SHA-256
`6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`
runs on local Windows/RTX 3070 with 99 requested GPU layers, one server slot
and explicit zero MiB RAM cache. Report actual device/process resource
samples rather than treating requested layers as observed offload.

Budget: one full exploratory attempt, at most 30 minutes after fixture setup.
The expected upper bound is 1,280 target calls and 2,560 tokenizer/template
preflight calls, plus loopback health checks. No regeneration or adaptive
prompt/model switch is authorized inside this identity. On timeout, malformed
response, OOM or assertion failure, stop and retain the ignored `.cache/eval/`
workspace, raw CLI/server logs, SQLite database and `failure.json`; report
the failed attempt before considering a separately declared variant. Execute
`task eval:cli:long:v5:scene` after precommit of this plan and harness.
