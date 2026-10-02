# Bounded real 7B v8 CLI screen on the same four Chinese cues

Date: 2 October 2026. Task: partial `LONG-01` / `EVAL-04`. The [same-prompt
REG-052 screen](2026-10-02-reg-052-cross-model-result.md) favored the local
7B on known name controls by source-aware AI triage. This experiment tests
the checked **product CLI** with a distinct 7B v8 profile, while preserving
the existing 1.8B v8 profile and prior raw outputs. It is an authored
development source, not long-file or release acceptance.

Use `eval/corpora/v7-batch-development-v1.zh.srt` unchanged (SHA-256
`ad88b2d2f96b153d5d8880175b321167263d7abaae48ca693d89b925459bc8a7`)
and the same one-scene four-cue mapping as the retained 1.8B size-four
attempt in `.cache/eval/v8-authored-batch-v1/attempt-GdrV2t/report.json`
(SHA-256 `ecdf4d7e02190a5b81e8fd06c0477c7bb5219076ad2138a91dbd9d15f912ee52`).
Run one fresh 7B `translate-v5-scene` CLI state with target batch four.
No Russian reference or prior answer enters the CLI prompt. Source
protection, journal persistence, preflight and output publication follow
the existing v8 implementation.

Pin new 7B v8 manifest SHA-256
`c287c53efbb4ce78471b64648ea3dd2f521363df0e168b7a61df1fdd6ae0479a`;
model revision `ab8472660ac61fac25f1af43fac2599d52a8a775` and GGUF SHA-256
`9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b`;
llama.cpp binary SHA-256
`6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`;
release CLI SHA-256
`854da57df8dff73e5349a3bb6eb7a50352ca5ff7d2ef74e89ec4aaecc1a7ad3e`.
One server, 2048 context, requested 99 GPU layers, one slot, Jinja and RAM
cache disabled. The v8 checked template is identical to the 1.8B v8
manifest, but model identity differs. Record the exact prompt, raw response,
token preflights/usage, accepted/rejected candidate, checkpoints, export,
time, source hash and sparse memory/GPU observations in ignored private
storage. Publish a redacted source-aware report, not an approved script.

Budget: at most four chats and eight template/tokenizer preflights in one
CLI command, 120 seconds command, 180 seconds readiness, 10 minutes wall,
zero model retries. Stop on structural rejection, timeout, OOM or identity
mismatch; retain the failed attempt without publishing partial SRT.
Preflight with `task eval:long:v8:7b:authored:preflight`, then run
`task eval:long:v8:7b:authored:probe`. The four-cue output can guide a
bounded natural-file test, but no bilingual reviewer, listener or clean
machine validation is available here.
