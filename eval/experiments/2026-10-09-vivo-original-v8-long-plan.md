# Matched original-platform Vivo v8 long-file screen

Date: 9 October 2026. Identity:
`LONG-04-vivo-original-v8-batch4-paired-2026-10-09-v1`.
Tasks: partial `CTX-02`, `LONG-01`, `LONG-02`, `LONG-04`, `EVAL-04` and
`DECIDE-01`. This is a known, unreviewed development source, not a sealed
holdout, licensed public corpus, approved translation or release candidate.
The separately supplied YouTube Chinese SRT is text-identical in all 467 cues
to the earlier Commons revision. The old v5/7B complete result is historical
context, not a controlled v8 baseline.

## Frozen input and compared factor

Source: creator's [18:36 Vivo/MediaTek interview](https://www.youtube.com/watch?v=_G4e2p1p-is),
original-platform `zh-CN` SRT SHA-256
`b100803367b95fa55fc638b1ff39a0abfa0d5b8183ebe58d58b1a87242d9d8c4`.
Matched private 240p media SHA-256
`7ad0484b31a6788c31632616649c51e6aaf6cdcdd7d90083d88e1d5ee66e1507`.
Read each immutable input, copy only the SRT to a separate ignored run directory,
and confirm its hash again after each arm. One provisional full-video scene
ends at cue 467 for both arms; this is a batching condition, not an asserted
speaker or shot map. Context is the checked v8 one-before/one-after source
policy, four target cues per request. No reference, prior translation or
expected Russian text enters inference.

The only paired factor is model size. Run 1.8B first and 7B second, both
Q4_K_M on the same source, scene policy, target grouping, prompt template,
2,048-token server context and one GPU server at a time. The server uses
`-ngl 99`, one slot, Jinja and disabled RAM prompt cache. The CLI's checked
profile fixes temperature 0.7, top-p 0.6, top-k 20, repeat penalty 1.05,
256 maximum tokens per line and a 120-second request timeout. No inference
seed is set by this CLI path; each arm is a single stochastic observation.

| Arm | GGUF SHA-256 | Manifest SHA-256 |
| --- | --- | --- |
| Hy-MT2 1.8B Q4_K_M | `dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699` | `1803aeb68428e1b138a17ed72b01abe1cc5fbc5845b5bca66a402b8936b1081f` |
| Hy-MT2 7B Q4_K_M | `9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b` | `c287c53efbb4ce78471b64648ea3dd2f521363df0e168b7a61df1fdd6ae0479a` |

Runtime: llama.cpp `b10977-0ecb159c9`, executable SHA-256
`6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`.
The clean-worktree release CLI built by `task build:release` has SHA-256
`5cb2a5a7187944f685bb16656a4dd65f29f166bdd5745f0693e59739998e8ed8`;
preflight must check it.

## Budget and acceptance of evidence

At most 117 chats and 234 template/tokenizer preflights per arm, one CLI run
per arm, zero retries, at most 15 minutes of CLI time and three minutes of
server readiness per arm, and 40 minutes total. The combined worst-case
configured token ceiling is below 720,000 prompt/completion tokens; the
observed count must be reported. Stop an arm on its first failed batch and
retain the raw response and accepted checkpoint prefix. Continue to the
second arm only if source, runtime and hardware remain usable. Stop both on
shared identity or infrastructure failure. Do not change model, prompt,
temperature or target size after seeing responses.

The Taskfile preflight hashes source, media, models, manifests, runtime and
CLI, checks v8 settings and the 467-cue grammar, and starts no model. The
probe keeps rendered requests, raw/restored responses, token counts, errors,
timings, sampled working set/VRAM, SQLite state and any output in ignored
private storage. The offline checker rehashes identities and every stored
request, verifies cue mapping and the durable prefix, and emits a source-free
public report. A complete file requires 467 mapped cues, a full result and
byte-identical offline re-export; a failed arm has no published partial SRT.

Inspect beginning (1–4), middle (232–239), end (460–467), batch seams
(4/5, 232/233, 464/465) and known fact risks (60, 276, 280, 328, 466)
where outputs exist. Compare both arms on the same reached cues, separating
AI source-aware triage from absent human bilingual review. Confirmed errors
receive minimal reproductions and related controls under policy 008. No
language score, model promotion, approved spoken script, G3–G5 or audio gate
follows from structural completion or an AI reading. Subtitle/audio rights
and human listener coverage remain unresolved.

## Infrastructure stop before inference

The first `task eval:long:v8:vivo:probe` invocation passed preflight but
failed at the initial child-process launch with `spawn EPERM` after 6 ms.
Its private report is
`.cache/eval/v8-vivo-original-long-v1/attempt-k0peWA/report.json`, SHA-256
`3a8ea031258fd13ffeb3e7cc7105f016385117dc9133dd155529cf7c58be643`.
It has zero arms, zero server starts and zero model requests. Preserve it.
Permit exactly one separately recorded infrastructure retry with the same
committed harness and inputs outside the restricted process sandbox. This
does not add an inference retry to either arm. If process launch still fails,
stop and diagnose without another model run.
