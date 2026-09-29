# Deterministic SRT property check plan

Date: 29 September 2026. Scope: `EVAL-04` format regression only. This does
not use a model, third-party data, human review or a release holdout.

Generate 64 fixed seeds (`0..63`) with one to 32 cues per file. Vary LF/CRLF,
UTF-8 BOM, no/single/double terminal newline, repeated external labels,
one to three text lines, Chinese/Russian/ASCII and numbers. The generator is
versioned in the behavior test. For every accepted file, require byte-identical
original render, then replace every text slot, reparse, and verify ordered
internal IDs, cue labels, timing, line count, replacement text and each
protected byte run. For every seed, insert unsupported markup into one text
slot and require rejection before translation. Bound each generated file to
32 cues and keep the test offline and deterministic.

The check is `task test:srt:generated`. Preserve any minimized failure as a
separate fixed regression and add related controls before changing production
parser/renderer code. A passing generated test is structural evidence only.
