# Source identifier mismatch diagnostic v1

Status: advisory fact check for a confirmed development failure, 29 September
2026. The [complete synthetic v6 run](../../eval/experiments/2026-09-29-long-v6-postlength-results.md)
lost or changed `AUR-####` on 665 of 1,280 accepted lines. The format adapter
correctly preserved cue structure and text slots; the identifiers were inside
translatable source text, so the previous core validator did not check them.
The exact `AUR-0002` omission and related/negative controls are frozen in
[REG-009](../../eval/regressions/long-v6-identifier-loss-v1.json).

For every target line, extract ASCII identifiers with two or more uppercase
letters, one hyphen and two through eight ASCII digits, bounded by nonword
characters or text edges. Compare the source and candidate **multisets** of
exact byte strings. Missing, changed, extra or duplicated identifiers add one
`identifier_mismatch` diagnostic for that line. Order may change in a
grammatical Russian sentence, but spelling, digits and multiplicity may not.
The rule also catches a Cyrillic lookalike such as `АУР-0002` because it does
not equal ASCII `AUR-0002`. Source context from other cues is not a target
fact. Ordinary dates, times, money, lowercase words and single-letter labels
do not match this narrow identifier grammar.

This addition is **advisory** for existing profiles: it saves the model text
and a typed checkpoint diagnostic without changing source, output, retry or
frozen prompt/profile identities. Historical checkpoints and results remain
readable. A complete result carrying this diagnostic is still `needs_review`;
it must not pass a source-identifier release gate. Strict rejection or a
deterministic protected-slot strategy requires a new versioned candidate and
same-source model comparison, because changing v6 acceptance in place would
invalidate existing checkpoint compatibility. This v1 rule is intentionally
narrow; Chinese names, numbers, negation, other code grammars and semantic
equivalence still require separate checks and human review.
