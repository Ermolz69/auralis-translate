# RELEASE-05 self-audit v8: source inventory advanced, gates remain open

Date: 2 October 2026. The audited committed Translate candidate is
`33186eaa766992c520f6cc18a10e2fd90bb3b52e` on `main`, comprising
`bcbb33f` and `33186ea` after the [v7 audit](2026-10-02-release-05-audit-attempt-v7.md).
The unrelated owner edit to `docs/architecture/014-result-history-selection.md`
and unrelated dirty Auralis worktree were excluded. This is an agent
**self-audit**, with zero independent bilingual reviewers and zero human
audio listeners. The owner rejected volunteer recruitment, so no outreach
was made. [PLAN-03](2026-09-28-goal-scope-v1.md),
[G1–G9/A1–A6](../../docs/RELEASE_ACCEPTANCE.md) and
[regression policy 008](../../docs/evaluation/008-regression-and-adversarial-checks.md)
remain unchanged.

The measured 7B/v8 ASUS development result remains 268/268 durable cues in
336,757 ms, with a separate `needs_review` SRT; the 1.8B arm stopped at
79 checkpoints. The 43-cue source-selected AI reading found six high-confidence
meaning/term risks. The corrected [REG-058 controls](2026-10-02-reg-058-paired-controls-result.md)
made 24 real chats and 48 preflights and retained semantic defects in both
models; the invalid first attempt remains archived. Their complete model,
runtime, profile, request, token, resource and hash identities are bound in
the [v7 audit](2026-10-02-release-05-audit-attempt-v7.md). No new model run
was made in v8, and no model or package has been selected for release.

The new [Chinese Wikipedia lesson screen](2026-10-02-commons-wikipedia-lesson-source-result.md)
retains Commons caption revision `100755166`, raw SRT SHA-256
`a94f5aeaf53e1420d7ecfcfeecf18c436b4eb042d215c7a1f445e9e06852078d`,
and matching OGV SHA-256
`bb72661298bbb6df017ee7e2a5f9cb93123592a810d8e19e6aa87c6cf4cd9ad1`.
Its separate derivative has 37 strict cues; 10 noncanonical millisecond
fields were mapped without editing source text or the original file. Measured
media duration is 239,000 ms and last cue end is 231,640 ms. The [v2 overlap
report](../reports/source-caption-overlap-v2.json) checks 12 current tracks,
11 media groups and 65 cross-group pairs with zero flags; its historical v1
predecessor remains unchanged. **Eligible Chinese cues remain 0** because
spoken-language/cue alignment, separate rights approval and independent
references/review are missing. This 3:59 clip also cannot satisfy A4's
10–20-minute scene duration.

| Gate | Current same-candidate observation | Decision |
| --- | --- | --- |
| G1–G2 structure/coverage | Prior 7B development file 268/268 with preserved source and `needs_review` output; 37 new source cues strictly inspected, not translated | Partial engineering evidence; release open |
| G3 adequacy | 0 eligible independently reviewed holdout cues; required 95% at ≥4/5 unmeasured | Fail/open |
| G4 critical errors | Six high-confidence AI risks plus real paired-control defects lack independent adjudication | Fail/open |
| G5 terminology | No human-approved source ledger or 98% same-candidate measurement | Fail/open |
| G6 resources | Prior 336,757-ms 7B run measured, but no selected SLA or final target | Fail/open |
| G7 recovery | Copy-resume evidence exists; final single-target fault matrix absent | Fail/open |
| G8 export | Development SRT structurally checked; final consumer/lineage acceptance absent | Fail/open |
| G9 installation | No unseeded Windows install through a selected final endpoint; desktop owner-deferred | Fail/open |
| A1–A6 audio | Prior 263 real SAPI WAV and played media are technical only, with 256 timing overruns and no approved script or three listened scenes | Fail/open |

On the committed candidate, `task check` passed Rust formatting, Clippy and
workspace tests. `task eval:data:check` passed 20 source/group controls plus
other overlap and duration controls, and resolved 12 tracks in 11 groups.
`task eval:data:current:bytes:check` passed all 12 private hashes, the new
source-free report reconciliation, the retained v1 54-pair screen and the
new v2 65-pair screen. `task
eval:data:commons:wikipedia-lesson:candidate:check` rejected the original
timing and accepted 37/37 derivative cues. `task
eval:data:commons:wikipedia-lesson:media:check` measured the actual stream
and zero cue overruns. `task docs:check`, `task plan:check`, `task site:build`
and `task site:check` passed; the generated current page keeps zero human
reviews visible and the separate historical page retains prior measurements.
The first sandboxed CLI child launch failed with `spawn EPERM`; the permitted
rerun passed and no failed source/model artifact was silently discarded.

The local primary global Git identity is `Ermolz <00ermzahar@gmail.com>`
for both author and committer of the two candidate commits. The prior
verified public/runnable rollback point is
`66b38957047472f8d77e9559337523bcb6517f54`. To roll back this source
and report slice, revert `33186ea` then `bcbb33f` after review, or publish
the earlier `site/` pair from a separate clean checkout; retain the private
raw source/media, previous reports, SQLite data and accepted results.
No migration or Auralis change was made. Pages deployment of this audit
record is checked separately after publication.

**Decision: RELEASE-05 failed/open.** Next engineering work is a frozen
source-scoped correction of the measured 7B meaning/term failures, followed
by a same-source real comparison and a new full-file audit. The full Goal
still requires an admitted Chinese-speech source, independent Chinese/Russian
assessment or an explicit owner-approved material scope change, an approved
voice script and real listening, a clean Windows target and the deferred
desktop scheduling decision. Automated checks remain triage, not a claimed
substitute for a human score.
