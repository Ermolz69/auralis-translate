# Frozen stratified Vivo full-file blind-spot review

Date: 10 October 2026. Tasks: `LONG-04`, `EVAL-04`, `CTX-03`.
Experiment ID: `VIVO-STRATIFIED-BLINDSPOT-2026-10-10-v1`. The 467-cue
original-platform Chinese SRT and both complete v8 Russian drafts are
existing, unreviewed development artifacts. This screen samples **new
locations** rather than tuning another prompt on REG-066/072. No inference,
ASR, TTS or network request is permitted.

## Frozen input identities

- Original Chinese SRT SHA-256
  `b100803367b95fa55fc638b1ff39a0abfa0d5b8183ebe58d58b1a87242d9d8c4`.
- Complete 7B/v8 Russian SRT SHA-256
  `4451868ea3e7cbb3ed81f3d24b5f85bc61a749168b213c54c88ae552208c4831`.
- Complete copied-recovery 1.8B/v8 Russian SRT SHA-256
  `32d96fe75eb0f5c90a67e2f6606d3d6ace27f79e67352a12b065efe91a08d3fc`.
- These are one full draft per model on the same Chinese source, with different
  recovery histories and no independent language score. Retain their original
  run reports, checkpoints and source bytes unchanged.

## Selection before viewing new translations

Partition source cue IDs into thirds `1–156`, `157–312`, `313–467`.
Choose a fixed 3-cue anchor window in each third, starting at `8`, `232`
and `450`. Then choose **four** more nonoverlapping 3-cue windows per third:
one each with Chinese numeric text, source negation, a named organization
or product, and a 4-cue v8 batch boundary. Exclude every window touching
the previously inspected focus ranges `57–60`, `273–282`, `325–329`,
`464–467`. Use only Chinese source text and cue IDs. For each feature,
rank eligible starts by SHA-256 of
`vivo-stratified-v1|third|feature|start` and take the first nonoverlapping
window. If a feature has no eligible window, choose the first ranked
nonoverlapping start and record the unmet feature. Do not inspect either
Russian draft before freezing the 15 selected windows and all source hashes.

The resulting **45 unique source cues and 90 source/target pairs** are a
development audit sample, not random independent observations or a sealed
holdout. Rehash and match all 467 source/draft IDs, timing lines and full
file bytes before extracting a private review packet. Preserve the Chinese
source and both raw accepted drafts for each selected cue, neighboring
Chinese context, source-scene interpretation, and separate 1.8B/7B
judgments. The public report contains only hashes, IDs, denominators and
AI-review outcomes. The first, middle, last thirds and selected batch seams
must remain identifiable in the report.

## Bounds and decision

One offline source-only selection and one offline paired replay; zero model
calls/retries; at most 15 windows, 45 unique cues, 90 draft comparisons,
20 seconds per deterministic replay. Retain a private attempt even on
failure. Source-aware AI triage marks `clear_major`, `minor`, `uncertain`
or `no_issue_seen` per *scene*, and records whether a finding is shared
across models. It must inspect names, quantities, negation, temporal and
actor relations, adjacent cue coherence and the file thirds/boundaries.
No quality rate or model win may be inferred from this purposive sample;
human Chinese–Russian review remains zero. Every clear new major error
needs exact source/draft hashes, minimal reproduction, new related and
negative controls and a catalog entry; uncertain cases stay review-needed.
If no new error is found, retain the negative result and its actual coverage.
Product v8, full SRTs, approved-script status and release gates do not change.
