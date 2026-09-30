# RELEASE-05 self-audit after complete ASUS technical audio: incomplete

Date: 30 September 2026. This is a continuation of the [previous incomplete
self-audit](2026-09-30-release-readiness-after-vivo.md) against the unchanged
[PLAN-03 scope](2026-09-28-goal-scope-v1.md), [acceptance gates](../../docs/RELEASE_ACCEPTANCE.md)
and [regression policy 008](../../docs/evaluation/008-regression-and-adversarial-checks.md).
It is **not** the final independently reviewed `RELEASE-05` audit. The local
Auralis branch `feat/real-tts-pilot` is at `12b109d`; Translate main was
`fb38e7f` before this report. The owner's unrelated dirty
`docs/architecture/014-result-history-selection.md` was not staged.

The [redacted full ASUS audio record](2026-09-30-asus-full-audio-technical-result.md)
pins the same Chinese SRT, v6 Russian candidate and matched 14:42 video as
the earlier structural translation run. Real SAPI created 268/268 WAVs in one
attempt; the third bounded mux corrected two retained media-timeline failures
and completed a full audio FFplay process. This is meaningful `VOICE-02`/`03`
technical evidence, but 264/268 cues exceed their windows, 259 spoken starts
overlap, and known translation errors remain. The 268-cue candidate has **0
independent bilingual reviews** and the media has **0 human listener scores**.
The nine inspected source candidates still contain 1,850 cues and zero
rights/alignment-admitted eligible cues.

| Gate | Current evidence and decision |
| --- | --- |
| G1–G2 | ASUS 268/268 strict SRT and durable offline re-export are technical file-level successes; the release format/source set and final candidate are not accepted. |
| G3–G5 | Independent holdout adequacy, zero critical errors and approved-term thresholds are unmeasured; AI source-aware review found serious ASUS meaning errors. Open. |
| G6–G9 | Selected SLA, full recovery matrix, target-consumer export and clean unseeded Windows installation are not proven. Open. |
| A1 | No independently reviewed translation, approved spoken wording or admitted source/caption rights. Open. |
| A2 | 268 real WAVs exist for an unapproved diagnostic; no selected-script natural managed batch or production worker produced them. Open. |
| A3 | Zero clipping and full timeline are measured, but 264 cue overruns and 259 overlaps fail fit. Open. |
| A4 | Only one 14:42 source, no human listening and no approved independent three-scene set. Open. |
| A5 | Full natural media decoded and played technically, but no restart/cancellation resource matrix for the complete speech/media pipeline. Open. |
| A6 | One `ffplay -nodisp` audio process completed, with separate video decode; no visual target-consumer review, listener approval, rights admission or release rollback. Open. |

The v1 mux incorrectly labelled a short-audio result technically passed; the
new regression detected its 14,147-ms missing tail. V2 preserved samples but
extended the container by 14,147 ms and introduced packet timestamp gaps.
V3 normalized audio PTS and passed exact-source duration and packet-gap
checks; all three reports and media files remain private. The failed results
are not erased or counted as successful pilot output. Synthesis did not
measure a continuous RAM peak; no SAPI resource ceiling follows from it.

Next required external evidence: a named independent Chinese/Russian reviewer
for source speech/caption alignment, candidate meaning, terminology and
spoken adaptation; listeners to rate three rights-cleared 10–20-minute
scenes; caption/video/audio rights review; and a clean Windows target for
installation and offline delivery. The user deferred desktop UI until an
explicit decision. Independent engineering work can continue, including
production media lineage, fit adaptation proposal, recovery tests and more
review-ready source packets. No model or TTS engine has been promoted.

Rollback: retain the immutable Chinese SRTs, previous translation results,
private WAVs and all three mux outputs. Revert only the scoped new Translate
commits if the public report must be withdrawn; the prior Pages revision is
`fb38e7f`. Leave the Auralis local branch unselected or revert its scoped
commits separately. Never overwrite user project databases or the owner's
unstaged architecture document. A newer Auralis schema requires a verified
compatible backup for rollback, not an unsafe old-binary open.
