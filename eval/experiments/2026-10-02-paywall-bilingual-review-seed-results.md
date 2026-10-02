# Matched Paywall Chinese-text model screen and review seed

Date: 2 October 2026. The frozen [plan](2026-10-02-paywall-bilingual-review-seed-plan.md)
and local revision `ede3ae878bacfd0b3b8f3dee15e89ab74e17d7d2` preceded both
model attempts. This is a development screen on an unassigned source, not a
blind human quality score or a Chinese-speech dubbing pilot.

## Source and fixed comparison

The original 880-cue Traditional Chinese SRT SHA-256 is
`3406fcd365446d727f31c4ecf576de6c3b5e168658c3f5d276fea8142ddb5a4b`.
Its [inventory](../corpora/paywall-chinese-candidate-v1.json) records CC BY
4.0 subtitle and film/audio rights, while reference rights, scene admission
and human review remain open. The film's catalog speech language is English.
The original SRT, matched OGV and older candidate results were not modified.

Both models received the same v5 source-only request projection on original
cue IDs 15–18, 465–468 and 861–864, in that order. These 12 cues contain
**16 text slots** and thus 16 actual chat calls per model. Source windows,
sampling settings, response schema and prompt template matched; the model
alias/weights and tokenizer usage differed. One stochastic pass per model
at temperature 0.7 cannot establish a stable superiority claim. Neither a
Russian reference nor expected meaning entered the model requests. The
[redacted summary](../reports/paywall-review-seed-v1.json) pins the raw
private report hashes, identities, output hashes, timings and resources.

| Measured item | Hy-MT2 1.8B Q4_K_M | Hy-MT2 7B Q4_K_M |
| --- | ---: | ---: |
| Structurally accepted cues / source text slots | 12 / 16 | 12 / 16 |
| Chat / tokenizer and template / all HTTP requests | 16 / 32 / 57 | 16 / 32 / 57 |
| Prompt / completion tokens | 4,441 / 763 | 4,434 / 764 |
| Three translation commands, measured ms | 31,083 | 89,742 |
| Whole run, including startup and checks, measured ms | 46,643 | 120,929 |
| Sampled process RSS peak, bytes | 1,554,915,328 | 5,070,094,336 |
| Sampled **device-wide** GPU memory used peak, MiB | 3,422 | 6,939 |
| Raw private report SHA-256 | `4be2d6f641338e5690ad4a3c8cf9ab2e3f908ec61ecfbbde2a90def3981af3eb` | `bf68b06e7c69eb68e677f2c6ba447e01cde04e4dd1527155a4a366131e68b0fa` |

The memory samples are observations of these runs, not isolated model memory
costs or deployment requirements. Every completed file re-exported from its
durable run byte-identically with the initial Russian SRT. The shared CLI
SHA-256 is `730c4ea0a63c402cdb231d22aa5a2a04a7bfff74fbe7ba28c33c4e151153cab3`;
the local llama runtime SHA-256 is
`6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`.
Model/profile hashes and all six output hashes are pinned in the redacted
summary. The raw 1.8B and 7B reports, source subsets, HTTP bodies, accepted
SRTs, SQLite state, resource samples and server logs remain private under
`.cache/eval/paywall-review-seed-{1b,7b}-v1/`.

## Source-aware AI triage, separate from human scores

- **REG-047, major suspected meaning omission:** Chinese cue 861 names
  Elsevier and says the company has talented people who know discoveries
  can benefit the public. The accepted 1.8B cue omits the name and those
  relations, repeating the following cue's business-idea content instead.
  The 7B candidate retains the name and first proposition. This is a
  source/accepted-output comparison and a review priority; zero independent
  reviewers have scored either candidate. The [minimal reproduction and
  controls](../regressions/paywall-source-name-omission-v1.json) preserve the
  exact source span, accepted output, related later-scene case and negative
  same-source 7B case. The surface check flags omission for 1.8B only; it
  does not certify the adequacy of 7B.
- **REG-048, numeric reading risk:** source cue 17 gives a price of
  10,702 USD; both accepted Russian lines use `10,702 доллара`. In Russian
  this comma can be read as a decimal separator. The
  [diagnostic controls](../regressions/paywall-russian-number-grouping-v1.json)
  flag that form while allowing space-grouped integers and decimal fractions.
  No human has decided the appropriate publication wording or rated the
  severity of either line.
- **REG-049, experiment-budget error:** the plan stated 12 chat calls plus
  four possible retries, but 12 cues contained 16 text slots. Both runs
  spent exactly 16 chat calls with no retry. The declared 16-call and
  64-total-request hard ceilings were not exceeded. The retained
  [four-cue/five-slot reproducer and controls](../regressions/paywall-multiline-slot-budget-v1.json)
  make future preflight count SRT text slots. The original plan remains
  visible with a dated correction; no second model attempt was made.

`task eval:natural:paywall:review-seed:check` matches every raw request and
response to durable SQLite, exact source subsets and output hashes, the same
source-only prompt across both models, all 16 chat/32 preflight requests per
model, offline re-exports and the triage controls. `task
eval:regression:catalog:check` includes REG-047–049. The screen has
**zero independently reviewed cues and zero listeners**. It selects no model,
admits no source or reference, and passes no G3–G5 or A1–A6 gate.

## Next use

Prepare a private consent-first reviewer packet from these three windows,
with opaque candidate labels and source-only context. A Chinese–Russian
volunteer must first confirm ability to cite the source and explain target
meaning; a second bilingual person is needed for critical/disputed calls.
Russian TTS listening needs separate listeners. Neither film audio nor the
English-language subtitles should be treated as a Chinese-speech gold source.
