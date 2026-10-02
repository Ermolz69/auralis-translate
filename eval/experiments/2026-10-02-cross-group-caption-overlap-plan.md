# Bounded cross-group caption overlap screen

Date: 2 October 2026. `DATA-05` partial, before any new source admission or
holdout assignment. Baseline is committed Translate `33ae23e`; the unrelated
working-tree edit to `docs/architecture/014-result-history-selection.md` is
excluded. The question is whether different media groups in the nine current
inventories contain substantial exact text overlap despite different SRT
bytes, cue timing, segmentation or media URLs. This is a development-data
leakage screen, not a language-quality or rights score.

Use only the eleven private SRTs already retained and SHA-256-pinned in the
current inventories. Do not fetch media, send model prompts, use references or
open the sealed holdout. Normalize subtitle text to Unicode NFC letters and
numbers, removing case, whitespace, punctuation and cue boundaries. Compare
sets of sliding 32-codepoint windows. Flag a cross-group pair if it shares at
least 64 distinct windows and at least 2% of the smaller window set. Keep
same-group alternate revisions as a positive non-failing control. This
conservative exact-text screen can miss paraphrases, script conversion and
short copies, and a flagged pair still needs source-aware adjudication.

Before checking retained bytes, add authored tests for the confirmed risk:
same transcript with changed timing/cue boundaries and hash; a partial copy;
same-group alternate segmentation; unrelated long captions; a short common
phrase; punctuation/spacing changes and duplicate windows. The current
manifest and byte checker must run first, then the overlap check. Budget: one
deterministic local cycle, at most eleven files and 55 pairs, zero network,
model and TTS calls, under 30 seconds wall time. Preserve any failure and
inspect it before changing the threshold. Run affected Taskfile checks,
`task plan:check`, `task docs:check`, `task site:build` and `task site:check`.
