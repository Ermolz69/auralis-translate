# REG-009 conservative prefix repair screen

Predeclared before execution on 29 September 2026. This is a development
screen, not an accepted product policy or language-quality result.

## Frozen identities and factor

- Source group: project-authored synthetic 1,024-cue long SRT, development
  split. The archived 1.8B v6 report SHA-256 is
  `2795ce22ee0b87f38fc23723dbd9b2802334a48b584c527d3a00f94a32c14fb8`;
  the frozen REG-009 pack SHA-256 is
  `54e4eccbed99a0158dff67b2a597d0a3bd95fdae53987a7de38a24e5e26489d3`.
- Baseline: the 1,280 accepted target lines in that report. Changed arm:
  take the same candidate and prepend the one exact source ASCII identifier
  followed by `: ` only when (1) the source has exactly one identifier in a
  short prefix ending at a full-width colon, (2) the candidate has no ASCII
  identifier and no Cyrillic code-like spelling, and (3) the candidate is
  nonempty. All other candidates remain byte-identical. This is a proposed
  output repair, not an additional model response.
- The algorithm may read source and accepted candidate lines only. Proposed
  Russian references, meanings and sealed holdout are excluded. The archived
  raw request journal, result file and checkpoint SQLite are never modified.
- One factor only: deterministic prefix insertion. There are zero model,
  network, paid-service or reviewer requests and no new sampling seed.

## Measures, controls and stop rule

Count exact source-code multiset matches before and after, repaired lines,
remaining mismatch classes, and any changes to already exact lines. Apply the
same function to REG-009's related and negative controls. Exact matches,
changed digits, duplicates, Cyrillic lookalikes, no-code and context-only
inputs must remain unchanged. A repair must never create an extra or wrong
ASCII code. Retain every unchanged failure; do not call the resulting Russian
text fluent or factually adequate without independent review.

`task eval:reg009:prefix-repair:probe` is capped at one pass over 1,280 lines,
60 seconds wall time and 512 MiB process RSS. Abort on a source/report identity
mismatch, unexpected slot count, control violation, newly broken exact line,
or any proposed line still failing its exact-code invariant. The JSON report
records all before/after lines and classifications, file/model identities,
duration and memory. A later product adoption requires a versioned policy,
separate profile identity, raw-versus-repaired attempt journal, guarded
validation, matched real-model checks and human language review.
