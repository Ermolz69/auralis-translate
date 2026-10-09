# Source quantity feature v1 rejected after one source-only scan

Date: 10 October 2026. The [precommitted plan](2026-10-10-source-quantity-feature-v1-plan.md)
used only the unchanged 467-cue Chinese Vivo SRT SHA-256
`b100803367b95fa55fc638b1ff39a0abfa0d5b8183ebe58d58b1a87242d9d8c4`.
Two unit tests passed after correcting the precommitted implementation;
the initial failed test outputs exposed regex boundary mistakes and are
retained in this work session, not counted as source results. The one
`task eval:vivo:quantity:report` run made zero model, ASR or TTS requests
and produced the [source-free report](../reports/2026-10-10-vivo-source-quantity-feature-v1.json),
SHA-256 `f13d6efcd08e0a166055551050d110a2b8b81c9f42e62b12d210a764477d64ec`.
It marked 20 of 467 cues: 10 beginning, four middle, six end. Both
previous generic-one cue IDs, 267 and 455, were correctly excluded.

Private source-only inspection found five clear false positives among
those 20 marked cues. Cue 85 enumerates first/second discussion points
rather than a measured amount; cues 236, 283 and 306 use the idiom
“a bit/point” rather than a clock hour; cue 415 contains chip model
labels followed by the Chinese character for “day” in the next model
name, which a loose whitespace rule joined into a fake duration.
Their source-text hashes are pinned in [REG-074](../regressions/reg-074-source-quantity-false-positives-v1.json).
These are source-feature classification mistakes, **not** translation
errors. The 20 hits were not independently language reviewed and the
remaining 447 cues were not exhaustively labeled, so no precision or
recall estimate follows. No Russian draft was opened by the scanner.

**Decision: reject v1 for future sample selection.** Preserve its report
and code, leave the earlier REG-073 freeze unchanged, and predeclare a
separate v2 classifier with controls for ordinal markers, ambiguous
`一点` and whitespace before model names. No product v8 or release gate
changes. The scanner can only choose what to inspect; it cannot verify
Chinese–Russian semantic accuracy.
