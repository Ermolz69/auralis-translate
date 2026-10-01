# ASUS source-context width: paired real-model screen

Date: 1 October 2026. This is known development data under `CTX-02`,
`EVAL-04` and `DECIDE-01`, following the [frozen plan](2026-10-01-asus-context-width-paired-plan.md)
committed as `44fa56be4762641326c2cef052a1d1c78646802c`. The first
`task eval:context:asus:width:preflight` stopped before inference: JSON property
order in reconstructed neighbor cues differed from the archived Rust request.
The minimal cue-2 mismatch was fixed in `d51b957785a36b88a007232c05e4efa1695a32e4`.
The same preflight then passed all 88 planned requests. No model attempt was
made before this correction. No failed result was erased or recast as inference.

The private immutable raw workspace is
`.cache/eval/asus-context-width-paired-v1/run-X4grxy` (not distributable).
`report.json` SHA-256 is
`2774488568d7eebc993616bb107a6aa76cf8f9ca6ea99f7438b915fa6968c7c9`;
`requests.jsonl` SHA-256 is
`18926c366346ebb4805abb23bf2e8108c2bf5378021f58e4b793d2b14a8336d6`.
The source SRT SHA-256 is
`923aed3991c2308d92b89c45181cea8ec7ece74e9b4d3a3ce0234d95e329913b`.
The [source-free summary](../reports/asus-context-width-paired-v1.json) contains
all four arms, prompt/completion tokens, wall and HTTP time, observed memory,
failures and review status. `task eval:context:asus:width:check` hashes every
raw request and response, re-parses the exact prompts and outputs, and checks
all 176 real `/apply-template` and `/tokenize` preflights against chat usage.
No Russian reference or expected answer entered a model request.

Both servers used pinned Hy-MT2 Q4_K_M models and llama.cpp runtime SHA-256
`6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`.
The 1.8B model/profile hashes are
`dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699` /
`b30546f228ba230364ba79edae55456d62e7d7c5010e56fef38464c3531089c5`;
the 7B hashes are
`9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b` /
`e7e2d7745cb283a88984da202eb511f0144b2bc51bc6eb01727515a51e7aa06f`.
The machine was Windows 10.0.19045, i7-6900K, 51,458,560,000 bytes RAM,
RTX 3070 8,192 MiB. Servers ran sequentially; GPU use is whole-device use.

| Model | Source cues each side | Cases | Outer JSON valid | Prompt / completion tokens | Chat HTTP sum | Largest prompt |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1.8B | 1 | 22 | 22 | 6,166 / 1,059 | 8,941 ms | 294 |
| 1.8B | 3 | 22 | 22 | 9,060 / 1,077 | 9,169 ms | 440 |
| 7B | 1 | 22 | 21 | 6,430 / 1,361 | 23,379 ms | 308 |
| 7B | 3 | 22 | 22 | 9,812 / 1,160 | 20,654 ms | 491 |

There were 88 chats, 176 preflights, 264 measured HTTP calls, zero retries,
zero preflight/chat token mismatches and 82,257 ms wall time. All prompts were
within the 1,728-token ceiling. Sampled peak server working set was
1,545,027,584 B for 1.8B and 5,063,069,696 B for 7B; sampled whole-device
GPU peaks were 1,976 and 5,545 MiB. Sampling every five seconds is a lower
bound for process peaks; the machine was not isolated. One 7B narrow cue-227
response used all 256 completion tokens, ended with `finish_reason=length`,
and did not produce outer JSON. It was retained without retry. A different
7B narrow seed-202 response had valid outer JSON but a wrapper-like text tail,
already covered by `REG-034`.

## Source-aware AI triage of all eleven paired targets

These are provisional interpretations of the Chinese source and raw Russian
answers, **not independent Chinese/Russian ratings**. Every row has two seeds
per model and width, with one failed 7B narrow response at cue 227.

| Cue | Paired finding |
| ---: | --- |
| 2 | Seven answers call the ROG handheld a tablet; 1.8B wide seed 202 calls it a smartphone. Widening does not solve device class. |
| 3 | 1.8B narrow seed 101 returns a grammatically incomplete introductory fragment inside valid JSON. Other 1.8B arms still misread ROG/handheld; 7B retains handheld gaming devices. |
| 12 | All eight answers keep 608 g and 60 g. The archived gram-to-gigabyte failure did not recur in this screen. |
| 20 | Wider context improves one 1.8B shoulder-button phrase, but Hall-trigger and shoulder-button terminology remains unstable in both models. |
| 91 | 1.8B narrow invents smartphone/tablet; 1.8B wide keeps a generic portable-device class in both seeds. 7B keeps a generic portable device in all arms. |
| 133 | Both 1.8B wide answers replace battery life with “survivability”; seed 101 also changes “most needs improvement” to “least improvable”. Narrow 1.8B retains unfavorable operating time; 7B keeps battery life. |
| 142 | Single-core performance becomes single-chip or malformed technical wording in both models. |
| 226 | Neither model produces approved hyperthreading terminology; 1.8B wide remains materially wrong. |
| 227 | 7B narrow has one length failure and another wrapper-like text tail; its two wide answers are structurally clean here. The source's 9 W and four cores are otherwise present. |
| 242 | 7B keeps the XG Mobile dock in all four answers; 1.8B changes the dock referent. |
| 267 | Only one narrow 7B answer says mouse pad; both wide 7B answers say mouse stand. |

The [REG-038 pack](../regressions/catalog-v23.json) pins two exact private
reproductions: a valid but incomplete cue-3 field and a wider-context cue-133
battery-life drift. It adds six authored related and five negative controls.
`task eval:regression:catalog:check` verifies the private raw hashes and
control inventory. **Control model runs: zero.** The cases prevent this screen
from being silently reported as a language pass; they do not constitute a
model fix or a future semantic acceptance check. The existing `REG-033` still
covers the earlier battery-life translation error, while `REG-034` covers the
wrapper-like tail. All raw failures remain available in the private journal.

Decision: do not switch the translation profile to three neighbors. This
eleven-target, two-seed development screen shows a local gain at cue 91 and
an adverse fact change at cue 133; it is insufficient for global selection.
The original 268-cue SRT and candidate are untouched. Rights and spoken
alignment for this source remain unverified. Human bilingual reviews: **0**;
no accepted spoken script, listener review, clean installation, model choice
or G1–G9/A1–A6 release claim follows.
