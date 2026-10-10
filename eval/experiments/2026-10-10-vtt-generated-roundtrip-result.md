# Strict WebVTT generated round-trip regression, 10 October 2026

Status: passed deterministic structural slice for `EVAL-04` and the declared
plain-WebVTT side of `INT-TR01`/G1. It does not complete G1 for a release
candidate or assert translation quality.

Before the first run, `vtt_generated_roundtrip.rs` fixed generator version 1:
64 seeds (`0..63`), 1–32 ordered cues per file, a fixed linear congruential
sequence, LF or CRLF, optional BOM, unique optional cue IDs, two valid timestamp
forms, permitted NOTE blocks, one to three text slots, and varied Chinese,
mixed-script and marker-like plain text. Each seed is used once for round-trip
and once for unsupported-markup injection. The test has no model, network,
random system seed or retry. A failure reports its seed and remains reproducible.

`task test:vtt:generated` passed 2/2 tests. Every generated source parsed,
rendered byte-for-byte without replacements, rendered with distinct Russian slot
replacements, reparsed with the same cue identity/timing/IDs and exact protected
byte runs, and retained its immutable source buffer. All 64 injected markup
variants were rejected before translation. This is a generated structural
control, not natural-media or semantic evidence.

The strict grammar's other unsupported cases remain covered by the existing
handwritten `vtt_roundtrip` suite. Real source admission, long-file fault and
resource checks, consumer export and the selected candidate's G1–G9 audit remain
open in the canonical backlog.
