# ASUS archived whole-file measurement-v2 audit plan

Frozen: 1 October 2026, before running the audit. Partial `EVAL-04` and
`LONG-04` diagnostic follow-up to
[REG-035](2026-10-01-signed-fullwidth-measurement-regression.md).

Question: which source/candidate cue IDs in the retained 268-cue ASUS v6
translation raise the current production `source_measurement_mismatch` review
warning? The previous read-only check covered only 44 source-selected cues.
This audit covers all 268; it does not infer that unflagged cues are accurate.

Immutable inputs are the private Chinese SRT SHA-256
`923aed3991c2308d92b89c45181cea8ec7ece74e9b4d3a3ce0234d95e329913b`
and archived Russian candidate SRT SHA-256
`aa74b20d4255f46c9a23ddfd0865dd2e221e7b08ab3cbceb8665be3b0c7b6e8b`.
Their paired source and result are the same v6 run documented in the
[structural result](2026-09-30-commons-asus-full-v6-slot-result.md). The
detector is Translate `e1b0f8f` with the REG-035 pack SHA-256
`dcf3945cfd6fea01b41be5889475bde8eae77315538773d03b6964ee937e5e88`.
No reference, reviewer answer or correction is supplied to the detector.

Run order and bound: add a Taskfile-only ignored Rust audit that first verifies
both file hashes and 268 one-to-one cue identities/timings; call the production
detector once for each paired text line; retain only cue IDs and counts in public
output. One attempt, zero model requests, zero token budget, at most two minutes
wall time. No retry after a successful audit. Stop without output if input hashes,
mapping or cue count change. Preserve old SRTs, SQLite, 44-cue packet and earlier
warning results unchanged. A new false positive or missed warning needs a
separate minimal reproduction and related/negative controls before a detector
change. Human bilingual review remains separately required for meaning.
