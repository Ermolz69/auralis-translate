# V7 context salience: matched real-model diagnostic

Date: 2 October 2026. Protocol: [frozen plan](2026-10-02-v7-context-salience-plan.md).
Machine-readable redacted result: [JSON](../reports/2026-10-02-v7-context-salience.json).
Task scope: partial `LONG-01`/`EVAL-04` and the known `REG-051` failure.

The first attempt failed before inference at `spawnSync git EPERM` and is
retained privately (report SHA-256
`73106be4e14aaeaf8668fdb01a37b82d651cc5d6ee838505eb1bbddb1218bb0a`).
The same frozen command, run with local process permission, completed four
real 1.8B/Q4_K_M requests in 4.4 s wall time (private report SHA-256
`fddef1df88456fb3585eddd8258fa1918bdda022cafe7b023b640563ebab647f`).
The pinned model, runtime, source, v7 manifest and baseline request hashes
are in the JSON. One server and one active machine were used. No request
contained a Russian reference.

| Seed | Context | Rendered prompt / output tokens | Chat HTTP | Raw model text for cue 1 | Source-aware AI reading |
| --- | --- | ---: | ---: | --- | --- |
| 101 | ticket cue 2 | 240 / 49 | 528 ms | `Этот билет стоит десять юаней, не нужно платить сто юаней.` | Wrong neighboring cue; no Wang or Friday |
| 101 | empty | 202 / 45 | 478 ms | `Менеджер Ванг сказал, что завтра не будет пятница.` | Target sense present, Russian grammar rough |
| 202 | empty | 202 / 45 | 446 ms | `Менеджер Ванг сказал, что завтра не будет пятница.` | Target sense present, Russian grammar rough |
| 202 | ticket cue 2 | 240 / 49 | 509 ms | `Этот билет стоит десять юаней, не нужно платить сто юаней.` | Wrong neighboring cue; no Wang or Friday |

All four HTTP responses were 200 with `stop`, structurally valid JSON and
matching target ID 1. All four actual prompt usages matched `/tokenize`; there
were eight successful `/apply-template`/`/tokenize` calls. Within each seed,
the sole input difference was presence of `source_context`. Reversing order
for seed 202 gave the same qualitative outcome. The model server reported
cache reuse on later requests, so the 446–528 ms chat timings are diagnostic,
not a latency comparison. One resource sample measured 1,542,529,024 bytes
server working set and 3,729 MiB device-wide GPU use; neither is a peak.

This confirms **local context contamination** for this authored cue and the
fixed v7 prompt: when given cue 2 as context, the model twice translated cue
2 under cue 1's correct ID. Without that context, it twice included Manager
Wang and tomorrow-not-Friday. The no-context output is not publication-ready
Russian. The narrow `REG-051` currency guard rejects this exact failure before
checkpoint; a substitution without an invented currency can still pass. A
deterministic evidence checker now freezes both paired outputs and validates
the paired request factor. Related controls cover the context-free target,
reversed request order, protected yuan target, dollar/euro inventions,
noncurrency words and ordinary nonmoney mapping. These are development
controls, not independent translation ratings.

Next bounded engineering work should test a new versioned target-first prompt
with context retained and a separately frozen one-factor comparison, then
exercise nonmonetary neighboring cues and a complete v7 batch if no target
swap is observed. Do not silently remove context from the product: it is
needed for names, pronouns and scene coherence. Long natural files, human
Chinese–Russian review, Auralis listening, and G3–G5/A1–A6 remain open.
