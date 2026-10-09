# RELEASE-05 self-audit v15: source clock warning stays evaluation-only

Date: 9 October 2026. This extends the [v14 audit](2026-10-09-release-05-audit-attempt-v14.md)
after the [offline source-clock replay](2026-10-09-source-clock-review-v1-result.md).
The committed PLAN-03 scope, original Chinese SRT, two complete v8
`needs_review` drafts, rejected fact-hint candidate and real SAPI technical
samples are unchanged. The new rule read existing outputs only; it made
zero model, ASR or TTS calls.

| Gates | Current decision and missing proof |
| --- | --- |
| G1–G2 | Partial: both existing long SRT drafts retain 467/467 cue identities and timing; no new candidate was generated |
| G3–G5 | Open: cue 328 now has an evaluation-only review warning, while the 36-month, team and future-product errors remain; no independent Chinese–Russian ratings or approved term ledger |
| G6–G8 | Open: no final quality/SLA/fault matrix or approved end-to-end consumer lineage |
| G9 | Open: no clean unseeded Windows installation for the chosen endpoint; desktop is owner-deferred |
| A1–A3 | Open: no independently reviewed final spoken script |
| A4–A6 | Open: no three listened final scenes, approved playable media or resolved distribution rights |

The rule recognized one source clock in 467 cues and flagged one known
wrong-hour translation. Its prior 7B baseline/candidate replay separated
the correct-hour and rejected wrong-hour responses. These are deterministic
and existing-model observations, not a measured language improvement or
human rating. The original YouTube regular Chinese track, Commons mirror
and three ASR source windows remain private development evidence with zero
release-admitted cues. Subtitle rights, actual listening and speaker
alignment remain unresolved. The owner has no independent reviewer/listener
and excluded volunteer outreach.

`task eval:source-clock:check` passed five deterministic test groups and
rehash of the pinned private inputs; `task plan:check` passed 53 tasks,
`task docs:check` passed 449 Markdown files, and `task site:build` plus
`task site:check` passed. The first site check exposed a stale v14 link
assertion; after updating that assertion it passed. The Pages live-byte
check must follow publication. A clean checkout without
the ignored source/draft/journal can run the authored unit controls but
cannot rehash private inputs. The v14 distinction between portable and
full private regression checks remains in force.

**RELEASE-05 remains failed/open.** Keep production v8, raw journals,
both drafts and the newer SQLite data. Next test the warning on a second
natural source family and address remaining source-fact errors without
using a closed holdout as prompt input. Human language/sound ratings,
rights, clean installation and final Auralis playback remain separate
required gates. Rollback remains a fresh v8 run with a compatible database
backup; never downgrade the existing database in place.
