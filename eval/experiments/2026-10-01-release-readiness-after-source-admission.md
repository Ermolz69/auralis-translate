# RELEASE-05 interim audit: source admission remains open

Date: 1 October 2026. This updates the
[context-width self-audit](2026-10-01-release-readiness-after-context-width.md)
for Translate candidate `8eba3bd1df4a65c090e61aaa5dfc33bc510c12a2`.
It is **not** final `RELEASE-05` acceptance. The frozen
[PLAN-03 scope](2026-09-28-goal-scope-v1.md) and G1–G9/A1–A6 decisions remain
unchanged: every release gate is open. The owner-deferred desktop stage is not
reclassified. Japanese and subtitle-free ASR remain separate; training and
precision changes remain measurement-conditional.

`DATA-03` screened two more independent 10–20-minute media candidates.
The 12:56 Mandarin-categorized [finance video](2026-10-01-xiaolin-source-inventory-result.md)
advertised no Chinese subtitle or automatic caption track in its pinned
metadata response. The 12:18 [restaurant video](2026-10-01-sethlui-caption-media-mismatch.md)
had a 271-cue strict Chinese SRT, but eight cues fell beyond the Commons-listed
video duration. `REG-039` retains the source-time mismatch and six boundary
controls. Neither source is admitted, reviewed or assigned to development or
holdout. The original nine registered candidates remain at 1,850 inspected,
**zero eligible** cues. No new model comparison, approved Russian script,
real-TTS attempt or human rating was made in this source-screening slice.

The new source-admission code checks every parsed cue against a separately
documented media duration when provided. `task eval:data:check`,
`task eval:data:candidates:inspect`,
`task eval:data:commons:sethlui:caption:check` and
`task eval:regression:catalog:check` passed. The exact private SRT and failed
probe records are retained under ignored `.cache/eval/`. `task plan:check`,
`task docs:check`, `task site:build`, `task site:check` and
`task site:live:check` passed. The published HTML at
`https://ermolz69.github.io/auralis-translate/?revision=8eba3bd1df4a65c090e61aaa5dfc33bc510c12a2`
was byte-identical to `site/index.html`: 1,086,693 bytes, SHA-256
`3f302403a46ddce4e4a14109e8c4e665df8bfc5dd8691ebd5ea0a7a3b7482414`.
Pages [workflow 36830010645](https://github.com/Ermolz69/auralis-translate/actions/runs/36830010645)
completed successfully. Earlier measurements and raw private artifacts were
not replaced.

Current decisive gaps remain: licensed and speech-aligned 200-cue development
sources plus an independent 300-cue holdout; bilingual reference and quality
review; selected long-file/token-batch and recovery evidence; an approved
spoken script, intelligible duration-fit audio across three 10–20-minute
scenes, listeners and consumer playback; an unseeded clean Windows target;
and the owner's later desktop decision. A source metadata check, strict SRT
parser success, mocks, and a byte-identical Pages deployment do not satisfy
translation or sound quality gates.

Rollback of this source-screening slice is by reverting commits
`1904ce2` through `8eba3bd` in reverse order. Keep the ignored immutable
responses, source bytes and failure records for audit; do not alter the
unrelated `docs/architecture/014-result-history-selection.md` working-tree
change or the separate local Auralis voice worktree.
