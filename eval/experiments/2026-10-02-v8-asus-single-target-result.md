# Matched natural v8 single-target run: 7B exports 268 cues, 1.8B stops at 80

Date: 2 October 2026. Frozen [plan](2026-10-02-v8-asus-single-target-plan.md);
[source-free report](../reports/2026-10-02-v8-asus-single-target.json).
The same private Chinese ASUS SRT, one provisional whole-video scene,
source-only neighbors and pinned runtime were used in two fresh isolated
states. Only the profile batch size changed from four to one relative to
the retained earlier attempt. The source SHA-256 stayed
`923aed3991c2308d92b89c45181cea8ec7ece74e9b4d3a3ce0234d95e329913b`.
The private raw report SHA-256 is
`9ae192177dd51611f49adf7699ca4fe9677a230dc74cbdedded2618040cc193c`.

| Model | Real chats / preflights | Durable cues | Prompt / completion tokens | CLI time | Result |
| --- | ---: | ---: | ---: | ---: | --- |
| 1.8B Q4_K_M | 80 / 160 | 79/268 | 22,337 / 3,587 | 57,768 ms | Failed at cue 80; no SRT |
| 7B Q4_K_M | 268 / 536 | 268/268 | 79,220 / 13,316 | 336,757 ms | Separate `needs_review` SRT, SHA-256 `746495ba8bfc9c7c3cee0b5021fea87c10605b1d8e07be6dc316907138ea48ee` |

`task eval:long:v8:asus:single:check` verified every raw chat request's
target ID and original Chinese text, both template/tokenizer calls, token
counts, contiguous checkpoints, source preservation, and all 268 SRT IDs
and timing lines in the complete 7B result. It also checks selected seam
anchors at 79/80, 140/141, 244/245, middle and end. No partial 1.8B
SRT or result row exists. Its 80th response stopped normally but repeated
one translation three times inside the single target field with embedded
newlines; the provider rejected it as `invalid_candidate` before checkpoint.
Request SHA-256
`758ddf354acabe872abb9a3ccd6de6a5b5d233804173f26f1d033901610dfabc`.

The 7B single-target command took 336,757 ms with 268 chats. Its sampled
server working set reached 5,068,574,720 bytes and device-wide GPU use
7,284 MiB on an 8 GiB RTX 3070. The 1.8B command took 57,768 ms but
stopped after 80 chats; comparing those command totals as model speed
would be invalid. The two v8 profiles cannot be compared for full-file
language quality because only 7B completed, and prior four-target runs
had different checkpoints and cache order. Samples are not clean-machine
peaks.

The 7B file is an engineering draft, not a checked translation. The
[source-aware AI risk audit](2026-10-02-v8-asus-single-target-risk-audit-result.md)
records several meaning and Russian-language problems. There are zero
independent bilingual assessments, no approved terms or script, no real
scene-cut map, and unresolved rights/alignment for this Chinese subtitle
track. The complete file must not be presented as accepted or used for a
final voice candidate. G3–G9/A1–A6 stay open.
