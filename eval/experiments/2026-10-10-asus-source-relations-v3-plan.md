# Frozen ASUS source-relation screen v3

Date: 10 October 2026. Experiment ID: `ASUS-SOURCE-RELATIONS-2026-10-10-v3`.
Partial tasks: `EVAL-04` and `CTX-03`; this cannot complete either task or
`LONG-04`. The question is whether a source-only warning, derived before
opening the Russian target, can recognize three explicit facts in a distinct
Chinese source and avoid false warnings on the retained complete draft.

## Inputs and split

The exposed development source is the 268-cue Geekerwan ASUS Chinese SRT,
SHA-256 `923aed3991c2308d92b89c45181cea8ec7ece74e9b4d3a3ce0234d95e329913b`.
The retained 7B/v8 Russian SRT is pinned to SHA-256
`746495ba8bfc9c7c3cee0b5021fea87c10605b1d8e07be6dc316907138ea48ee`.
Both remain private and immutable. This is a distinct source group from the
Vivo interview, but not a sealed holdout or an independently reviewed corpus.
The original-media/version mismatch noted for the current ASUS upload is
irrelevant to this *subtitle-only development replay* and prevents using this
pair as a release media scene.

The source-only selection, made without reading the Russian draft, is:

| Cue | Source fact | Nearby source-only contrast |
| ---: | --- | --- |
| 24 | The handheld's sticks are not Hall-effect sticks | 25 mentions ordinary sticks and an RGB ring, without asserting Hall sensors |
| 226 | BIOS does not offer disabling cores or hyperthreading | 227 wishes to run only four cores at 9 W, without asserting that the option exists |
| 253 | At review time, the price has not been announced | 252 says buying value depends on price; 254 asks what the price should be |

The v3 rule will recognize only affirmative Chinese denial forms for those
three facts, independent of cue IDs. It will flag only narrow **affirmative
Russian contradictions**: Hall-effect sticks in use, BIOS allowing core or
hyperthreading disablement, or a price already known/announced. Explicit
Russian negation must abstain. It may miss paraphrases and facts relocated
to neighboring target cues; those misses are reported, not silently repaired.
Existing v1/v2 Vivo relations remain byte-for-byte unchanged. V3 is
evaluation-only and cannot mutate the v8 profile, result or checkpoint.

Before opening the Russian target, add deterministic positive, negated and
source-negative controls for each fact; verify first/middle/last cue and
neighbor timing/identity boundaries. Authored controls are development
fixtures, not independent examples. Inspect the three pinned target cues
and adjacent target context only after the plan and implementation freeze;
record an AI source-aware judgment for each, separate from machine counts.
For any confirmed new translation error, retain a minimal reproduction,
related positive and negative controls under regression policy 008.

## Limits and decision

One offline replay of 268 source/target pairs, one draft, no model/ASR/TTS/
network request, zero retries, 30-second process budget and no GPU use.
Pin and rehash source, draft and v3 rule before counting. Require exact cue
count, cue IDs and timing lines. Preserve any failed attempt in ignored
private storage. The report publishes only cue IDs, hashes, rule kinds and
counts; no full subtitle text or model output is republished.

Report recognized source cues per class and total coverage over all 268
cues. Report every warning, then source-aware AI triage of every warning
and the three chosen cues. A zero warning count cannot establish a
false-positive rate; even nonzero AI triage is not independent precision.
Do not promote the rule or the draft without independent bilingual review,
source rights and the complete long-file release gates. Rollback is the
unchanged v8 profile and prior v1/v2 evidence.
