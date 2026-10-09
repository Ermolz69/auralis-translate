# RELEASE-05 self-audit v12: short controls do not close natural quality

Date: 9 October 2026. This extends the [v11 gate-by-gate self-audit](2026-10-09-release-05-audit-attempt-v11.md)
for the committed REG-066 evidence at `e80b39d`. The frozen PLAN-03 scope,
G1–G9/A1–A6 thresholds, original source and original v8 full-file drafts are
unchanged. The new [REG-066 authored screen](2026-10-09-reg066-authored-v8-screen-result.md)
ran 20 real chats and 40 preflights against the same two pinned v8 models.
Its machine report, separate AI review, frozen request hashes, and all raw
responses are verified; catalog v47 preserves the prior catalogs.

Source-aware AI triage on ten open authored controls per model marked eight
focus facts preserved and two `needs_review` for each. This does not measure
the required independent holdout, and it does not repair the full natural
467-cue translations. The observed difference between simple controls and
fragmented natural cues is a **hypothesis** about context and batch boundaries,
not proof of a causal fix. No model, prompt, term profile, selected package or
spoken script is promoted.

| Gates | Current decision and missing proof |
| --- | --- |
| G1–G2 | Partial structural development evidence: two complete `needs_review` 467-cue SRTs; no admitted final candidate |
| G3–G5 | Open: zero independent eligible holdout reviews, natural critical fact risks and no approved-term score |
| G6–G8 | Open: no final SLA/fault matrix or accepted consumer lineage; a copied recovery and 7B offline re-export are narrow evidence |
| G9 | Open: no clean unseeded Windows installation through the selected final endpoint; desktop remains owner-deferred |
| A1–A3 | Open: no reviewed translation/spoken script; earlier real TTS does not meet final lineage or fit limits |
| A4–A6 | Open: no three listened scenes, complete approved media durability, or final rights-cleared delivery |

The source still has zero eligible release cues: manual speech alignment and
rights for the Vivo captions/audio are unresolved. Independent Chinese-Russian
review and listeners are unavailable; the owner ruled out volunteer contact.
No ASR score substitutes for them. Fine-tuning and higher precision remain
conditional on further measured evidence, while Japanese and no-subtitle ASR
remain outside this scope.

The REG-066 checks `task eval:regression:reg066:screen:check`,
`task eval:regression:reg066:screen:catalog:check` and
`task eval:regression:catalog:recent:check` passed. `task plan:check`,
`task docs:check`, `task site:build` and `task site:check` passed after the
report update. The REG-066 replay check in the isolated checkout used
`AURALIS_EVAL_ASSET_ROOT` pointing to the original project root for its
pinned runtime, models and private raw journal; the default local path has
no runtime copy. Publication of this audit is a separate live-page check.

**RELEASE-05 remains failed/open.** Next: predeclare and run a bounded
same-source boundary/scene comparison, preserving the natural failures and
all ten REG-066 controls. Advance to Auralis voice work only with explicit
`needs_review` lineage until a script is approved; technical audio does not
close the listening gates. Rollback is the unchanged v8 profile and a fresh
run in an isolated checkout, keeping historical results and a compatible
SQLite backup; never downgrade a newer database in place.
