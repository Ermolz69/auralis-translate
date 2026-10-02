# Natural 268-cue v8 screen: both models stop safely on malformed output

Date: 2 October 2026. Frozen [plan](2026-10-02-v8-asus-natural-long-plan.md);
[source-free machine report](../reports/2026-10-02-v8-asus-natural-long.json).
Both real CLI arms used the same private Chinese SRT and one provisional
whole-video scene, with separate SQLite states and model servers. The
source SHA-256 remained
`923aed3991c2308d92b89c45181cea8ec7ece74e9b4d3a3ce0234d95e329913b`
in each arm, and the paired source video SHA-256 was verified. The private
report SHA-256 is
`e67560c2cf31bd8571df5d73cbc5d4b9f8c4ff8e0343f549d03ddee703c1657e`.
It retains every raw request/response, checkpoint, CLI error and resource
sample. `task eval:long:v8:asus:check` rechecks all chat/preflight triples,
rendered tokenizer counts, cue IDs/source text, hashes and lack of output.

| Model | Chats / preflights | Durable prefix | First failed target | Prompt / completion tokens | CLI time | Full SRT |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| 1.8B Q4_K_M | 55 / 110 | 54 of 67 batches = 216 cues | 217 | 26,252 / 9,390 | 99,723 ms | none |
| 7B Q4_K_M | 36 / 72 | 35 of 67 batches = 140 cues | 141 | 18,182 / 6,677 | 166,205 ms | none |

The 1.8B server returned `finish_reason=stop` for batch 217–220, but the
inner translation was malformed and the provider recorded
`invalid_candidate`: `v7 response contains invalid target text`. The
last request SHA-256 is
`e173be2886df01f1cfcaf9149fd9c3b925b34bcd2131073068557a4b33dfc9f9`;
raw response SHA-256
`d27870f599155eecee70a8fe83f90a4df7b5b7ad8d24e9dd0f2778314f4c72c9`.
Its first 54 validated batches remain recoverable; no result row or SRT
was published.

The 7B server returned `finish_reason=stop` for batch 141–144. Its
outer JSON parsed into four target IDs, but model text contained leaked
JSON delimiter fragments. The provider journal recorded
`validated_batch`; the SRT-specific checker then rejected the lines with
`SRT target line violates supported text grammar`. **The 36th batch was
not checkpointed.** Only the earlier 35 batches remain durable, with
zero result rows and no SRT. The last request SHA-256 is
`3049068ad712328bf93ec96bfa62d85dcdc9ebbaefa154cfe9ee9c1f0962358e`;
raw response SHA-256
`71a7145720321dc0b657f1bbbc9ca4438d3ab76e33777e47d46ca0c300907436`.
This exposed a provider-level classification gap. A narrow decoder guard
now rejects leaked JSON structure **before** the provider writes
`validated_batch`; the existing SRT checker remains a second boundary
before checkpoint. The original failed run is retained, not rewritten.

The two arms reached different prefixes, so neither yields a complete
natural-file translation or a paired long-file quality comparison. They
are known development material with earlier v6 results, not a holdout.
No independent bilingual review was performed. No model-derived Russian
reference entered requests. One provisional scene does not test real
scene cuts. The next bounded recovery experiment should use the same
frozen source/model identities, retain the failed attempts, and test a
versioned smaller batch or a single explicit resume without unlimited
sampling. Actual cue-level AI triage of the 216/140 prefixes cannot be
promoted to full-file quality.

Observed maximum server working set was 1,544,556,544 bytes (1.8B) and
5,061,615,616 bytes (7B); device-wide GPU readings reached 3,917 and
7,535 MiB respectively on an 8 GiB RTX 3070. These are sparse samples,
not isolated peaks or clean-machine headroom. G3–G9/A1–A6 remain open.
