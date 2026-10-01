# RELEASE-05 audit attempt 2: technical audio admitted, release withheld

Date: 1 October 2026. Auditor: project agent; independent human review count
is zero. This is a failed committed-state audit under the
[frozen PLAN-03 scope](2026-09-28-goal-scope-v1.md) and
[release criteria](../../docs/RELEASE_ACCEPTANCE.md). It supersedes neither the
first [failed audit attempt](2026-10-01-release-05-audit-attempt.md) nor its
retained baselines. No candidate is selected for release.

The audited Translate `main` commit is
`584370d659394fb21f10441e0a00c5b74176f8c6`, pushed to `origin/main`.
The sibling Auralis technical speech/media worktree is the local
`feat/real-tts-pilot` commit `2ce8be5`, with no remote release claim.
Both sets of scoped commits use the verified computer-wide primary Git
identity `Ermolz <00ermzahar@gmail.com>` as author and committer. The unrelated
working-tree edit to `docs/architecture/014-result-history-selection.md` was
excluded. The earlier release CLI SHA-256
`4bbe8ec9878498d8c6ea085c33801b52dbcd7732caa532cffba3e939e5be7eb7`,
7B model SHA-256
`9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b`
and v6 manifest SHA-256
`268c4d00eee8994936d7019d4cad47a5193a01e459ad9ed4214ea30facd102f9`
remain the experiment identities, not newly rebuilt final release artifacts.

## Gate disposition

| Gate | Audited observation | Decision |
| --- | --- | --- |
| G1–G2 | One separate structurally valid 263/263 Russian SRT, original preserved, 263 durable checkpoints and an offline byte-identical export; two earlier failed 7B states retained. | Engineering evidence only; source admission and final candidate absent. |
| G3–G5 | Zero eligible holdout cues and zero independent bilingual ratings. AI triage retains wrong dim sum role and a three-way venue-name inconsistency (`REG-044`). | Fail; adequacy, critical-error and term thresholds cannot be asserted. |
| G6–G8 | One 308,207-ms 7B translation with 71,212 input and 10,259 output tokens, measured RAM/GPU, bounded cue-62 retry and recovery; exact final-candidate target/resource and fault matrix unfinished. | Open. |
| G9 | No unseeded clean Windows installation through the final native endpoint; desktop remains owner-deferred. | Fail. |
| A1–A3 | Same-source Auralis real SAPI produced 263 verified WAVs and complete private media. Raw fit fails at 256 cue overruns/236 overlaps; even hypothetical 2× leaves 105 windows unfit. Script, rights, speech alignment and selected-result handoff lack approval. | Fail. |
| A4–A6 | Full 738,056-ms audio was decoded without clipped samples or packet gaps over 1 ms; one FFplay process completed in 742,979 ms. Zero people listened or assessed sound. Only one unapproved 12:18 candidate exists, not three reviewed 10–20-minute scenes. | Fail. |

The pinned [real-audio result](2026-10-01-sethlui-real-audio-technical-result.md),
[fit calculation](2026-10-01-sethlui-audio-fit-feasibility-result.md) and
[redacted measurement JSON](../reports/2026-10-01-sethlui-real-audio-summary.json)
identify source, Russian draft, runtime, WAV analysis, media and playback by
hash. The private subtitle, WAV and MKV bytes are excluded from publication.
The [interim gate matrix](2026-10-01-release-readiness-after-sethlui-audio.md)
retains the finer G1–G9/A1–A6 breakdown.

## Exact checks and publication

On the committed Translate state, `task eval:natural:sethlui:v6:7b:length-tail:result:check`
reverified the 264 real model requests, one rejected cue-62 response, 263
checkpoints and private report SHA-256
`5bbe00880f6e22a3d9831eddf1404f7c4a51503ed29809325294dd56cd82ddd0`.
`task test:json-tail:retry`, `task eval:regression:catalog:check`,
`task docs:check`, `task plan:check`, `task site:build`, `task site:check` and
`task site:live:check` passed. On Auralis, `task voice:natural:sethlui:media:check`,
`task voice:natural:asus:fit:test`, `task voice:natural:sethlui:fit:check` and
`task docs:check` passed. The new fit screen was one read-only 17-ms request;
it did not redo TTS or playback. These checks do not confer translation or
sound quality acceptance.

GitHub Pages workflow [36907751404](https://github.com/Ermolz69/auralis-translate/actions/runs/36907751404)
completed successfully for the exact Translate commit. A retained first
`task site:live:check` after the prior report push saw the old page; after its
deployment completed, byte identity passed. For this audited commit, the
[live report](https://ermolz69.github.io/auralis-translate/?revision=584370d659394fb21f10441e0a00c5b74176f8c6)
matched committed `site/index.html`: 1,117,431 bytes, SHA-256
`e1fd4194abfa2485e6722e70ea42695ab06fd1bbd28b02d9f93dc9aeedc030de`.
Historical public measurements remained embedded and the private media was
not uploaded.

**Decision: RELEASE-05 fails and remains planned. G1–G9/A1–A6 do not pass;
the Goal is incomplete.** Needed external evidence is an admitted
Chinese-speech subtitle/video corpus with usage rights, independent
Chinese–Russian reviewer and adjudicator, identified audio listeners and a
clean unseeded Windows x64 target. The owner has not scheduled the deferred
desktop slice. No further model fine-tuning, precision increase or final
release claim is justified by these measurements alone.

For rollback, `decb1f8c0ad736029119f8005894409befd4273a` is the prior
Translate report baseline before these audio additions and `155af06` is the
intermediate real-audio report before the fit screen. Revert the scoped
Translate commits on a new branch and republish the prior page if needed;
the immutable source, prior experiments and unrelated architecture edit are
outside those commits. The Auralis voice work is on a separate local branch;
reverting its scoped commits or abandoning that branch does not mutate the
primary Auralis checkout. Deleting the private media cache would remove
reproducibility artifacts and requires a separate retention decision.
