# General fact reminder did not repair the natural Vivo fact errors

Date: 30 September 2026. Task: `CTX-02` / `EVAL-04` / `DECIDE-01`. The
[one-factor plan](2026-09-30-vivo-general-fact-reminder-plan.md) and harness
were committed at Translate `e2065219cb521c41e85248fd40b1afa4a9b51967`
before inference. `task eval:natural:vivo:general-fact:preflight` verified 23
same-source/development-control cases and 28 exact archived 7B requests.
`task eval:natural:vivo:general-fact:probe` made exactly 28 calls with one
additional general fact sentence, one local server start, zero retries and no
Russian/English expected meaning in model prompts. All raw requests/responses
remain private under `.cache/eval/commons-vivo-general-fact-reminder-v1/run-pSegnt/`.
The private report SHA-256 is
`5923d2a0ee51daa545084a2602977452ccb3e944cf0a94c18c0a5626eb846519`;
the append-only raw JSONL SHA-256 is
`ec5e79a7fedc7554457d3b88c020958bc0eaed71bc67a4a7f62366820b990667`.
`task eval:natural:vivo:general-fact:check` rechecked every exact baseline/variant
request, that the one sentence was the sole change, raw/accepted structural
responses, tokens, timings, sampled resources and the
[redacted summary](../reports/2026-09-30-vivo-general-fact-reminder-summary.json).

| Observation on the same 28 7B requests | Baseline v5 | One-sentence variant |
| --- | ---: | ---: |
| Structurally valid JSON target slots | 28/28 | 28/28 |
| Prompt / completion tokens | 6,512 / 1,412 | 8,080 / 1,430 |
| Sum of instrumented chat HTTP time | 24,492 ms | 24,608 ms |
| Sampled server working-set peak | 5,060,325,376 B | 5,061,095,424 B |
| Sampled whole-device GPU use peak | 5,749 MiB | 5,742 MiB |

The variant active run took 30,958 ms after hash checks. Baseline active wall
time included both 1.8B and 7B, so it is not a comparable one-model total.
Samples came every five seconds on an active machine; GPU use includes other
applications. Prompt tokens rose by 1,568 (24.1%) for no demonstrated natural
quality gain. No durable translated SRT was produced by this direct-chat screen.

**AI source-aware triage, no human score:** The natural 9400 generation window
dropped the invented first-generation claim in one of two seeds, but repeated it
in the other. Both 36-month outputs still anchored the interval before an
earliest stage. Both team-investment outputs still specified funds where the
next source cue identifies a jointly supplied team. Both late-work outputs
still changed 1–2 a.m. into 11–12 p.m. The closing future-products window
still alternated between a present offer and future benefit, and one variant
lost Russian grammatical fluency. Among authored controls, the future-benefit
case better preserved the recipient, while the unspecified-resource case
remained semantically risky. Most controls were unchanged. These are inspected
development cases and AI interpretations, not blinded or independent human
ratings; the other 462 Vivo cues were not screened here.

The extra instruction is **not promoted** into a versioned release profile.
Keep the exact failed outputs and REG-025–027 controls; do not repeat with new
wording until a distinct hypothesis and budget are frozen. This failure does
not isolate a model-weight or quantization-precision cause. Independent
Chinese–Russian review, additional source groups, rights/alignment admission
and G3/G4/G5 still remain open.
