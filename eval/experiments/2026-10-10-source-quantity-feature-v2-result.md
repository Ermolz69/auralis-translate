# Source-only quantity feature v2: known false positives removed

Date: 10 October 2026. The [precommitted v2 plan](2026-10-10-source-quantity-feature-v2-plan.md)
and [REG-074 controls](../regressions/reg-074-source-quantity-false-positives-v1.json)
were in Git before one replay on the same exposed 467-cue Chinese Vivo
source. The source SRT SHA-256 is
`b100803367b95fa55fc638b1ff39a0abfa0d5b8183ebe58d58b1a87242d9d8c4`.
The rejected [v1 report](../reports/2026-10-10-vivo-source-quantity-feature-v1.json)
remains unchanged, SHA-256
`f13d6efcd08e0a166055551050d110a2b8b81c9f42e62b12d210a764477d64ec`.

`task eval:vivo:quantity:v2:report` scanned only source text once; the
[source-free v2 report](../reports/2026-10-10-vivo-source-quantity-feature-v2.json)
has SHA-256 `4fa3ca708ddce06e63f496610669930050ab09440ae8296318b70b2b7bfa51ad`.
`task eval:vivo:quantity:v2:check` independently recomputed the exact
report. The v2 feature marked 15 cues versus v1's 20, removing exactly
IDs 85, 236, 283, 306 and 415, with no new IDs. All five related
false-positive controls and five true-quantity counterexamples passed.
The report pins every matched cue ID and source-text hash; the raw Chinese
text stays in the private original source. Russian drafts read: 0. New
model, ASR, TTS and network calls: 0.

**Decision: eligible only for a future predeclared source-only sampler.**
This is an open development replay on the same source, so it supplies no
independent precision/recall measurement. The remaining 15 marks were
inspected for the known idiom and model-name failure families, not
exhaustively adjudicated for every possible numeric meaning; unmarked
source cues were not fully labeled. A new source family must check both
false positives and missed quantities before broader trust. The v1 code,
v1 report, REG-073 freeze, translation drafts, v8 profile and release
decisions remain unchanged. This feature identifies possible review
locations; it does not validate translated facts or audio.
