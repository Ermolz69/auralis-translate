# RELEASE-05 committed-candidate audit attempt 3: release withheld

Date: 2 October 2026. This is a self-audit of the committed and published
Translate `main` candidate `82b824fdecd9f4c9ded4d7a213d4f474154dd073`
against the [frozen PLAN-03 scope](2026-09-28-goal-scope-v1.md) and
[release criteria](../../docs/RELEASE_ACCEPTANCE.md). It does not replace
the retained [second failed audit](2026-10-01-release-05-audit-attempt-v2.md).
No independent language reviewer, adjudicator or audio listener participated.
The sibling Auralis voice worktree remains local at `10427b8` on
`feat/real-tts-pilot`; it has no release claim. Both repositories' scoped
commits use `Ermolz <00ermzahar@gmail.com>` as author and committer. The
unrelated Translate working-tree edit to
`docs/architecture/014-result-history-selection.md` was excluded.

## Gate decision on this candidate

| Gate | Observed evidence | Decision |
| --- | --- | --- |
| G1–G2 | The 263-cue natural restaurant run yielded one complete, structurally valid Russian SRT and 263 durable checkpoints after a bounded cue-62 retry. Original bytes and old failed states remain. The new read-only `audit-terms` validates source/result structure before reporting, including a 1,024-cue authored ladder. | Partial engineering coverage; no admitted release source or selected final candidate. |
| G3–G5 | Eleven source candidates and 2,993 inspected cues yielded zero eligible holdout cues. Independent Chinese–Russian ratings: 0. AI triage still identifies the wrong dim sum role and three restaurant-name renderings (`REG-044`). The new audit checks declared approved forms only; no independently approved ledger exists for that draft. | Fail. No 95% adequacy, zero-critical-error or 98% terminology assertion. |
| G6–G8 | One 7B 263-cue run took 308,207 ms, 71,212 input and 10,259 output tokens, with logged RAM/GPU and recovery. CLI checks and offline re-export exist. Final candidate SLA, consumer matrix and declared fault coverage are incomplete. | Open. |
| G9 | No unseeded clean Windows installation through the final endpoint. Desktop scheduling remains owner-deferred. | Fail. |
| A1–A3 | Real SAPI made and independently decoded 263/263 WAVs from the same unapproved Russian draft. Full private media exists. Raw speech exceeds 256 cue windows and overlaps 236 starts; hypothetical 2× still leaves 105 windows unfit at the declared margin. Script, rights, speaker and voice approval are missing. | Fail. |
| A4–A6 | One 738,056-ms media track decoded over the full source video and an FFplay process completed in 742,979 ms. A private six-window source/dub packet covers 49 distinct cues but has zero completed listener forms. Three approved 10–20-minute scenes, human ratings, source-speech alignment and clean consumer coverage are absent. | Fail. |

The [real-model restaurant comparison](2026-10-01-sethlui-json-tail-length-retry-result.md),
[real-audio technical result](2026-10-01-sethlui-real-audio-technical-result.md),
[private audition preparation](2026-10-01-sethlui-private-audition-packet-result.md)
and [new whole-result audit](2026-10-02-v5-whole-result-term-audit.md)
retain their separate methods and limits. No model retraining or higher-precision
quantization is selected from these measurements. Japanese and subtitle-free
ASR remain separate scopes. The required desktop decision is still outstanding;
the CLI evidence does not complete a desktop release.

## Candidate identity, checks and publication

The measured 7B model SHA-256 remains
`9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b`;
the v6 manifest SHA-256 remains
`268c4d00eee8994936d7019d4cad47a5193a01e459ad9ed4214ea30facd102f9`.
These identify an experiment, not a rebuilt final release package. The prior
release CLI SHA-256
`4bbe8ec9878498d8c6ea085c33801b52dbcd7732caa532cffba3e939e5be7eb7`
is also a historical artifact, not this candidate's binary hash.

On the exact candidate tree, `task test:approved-terms:audit` passed one core
and two CLI tests; `task test:v5-terms` passed its full targeted suite;
`task fmt`, `task lint`, `task test:cli:protocol` (7/7), `task docs:check`
(343 Markdown files), `task plan:check`, `task site:build`, `task site:check`
and `task site:live:check` passed. `task fmt:fix` was used before the checks.
The authored 1,024-cue boundary fixture warns at cues 1, 512 and 1024 and
does not warn on the similar spelling at 511 and 513. It makes no natural
quality claim. Earlier real-model and TTS experiments were retained, not
repeated for this contract-only change.

[Pages run 36926427569](https://github.com/Ermolz69/auralis-translate/actions/runs/36926427569)
completed successfully for `82b824f`. The
[live report](https://ermolz69.github.io/auralis-translate/?revision=82b824fdecd9f4c9ded4d7a213d4f474154dd073)
matched committed `site/index.html` byte for byte: 1,122,409 bytes,
SHA-256 `9c090a59e2f26a4ce6118b56d1d4b63a452533bb1198c9f34ff2c9c2038616a1`.
Historical public measurements remain embedded. Private source, WAV and MKV
bytes were not published.

**RELEASE-05 fails and remains planned. The Goal is incomplete.** Needed
external inputs are an admitted Chinese-speech video/subtitle source with
usable rights, an independent Chinese–Russian reviewer and adjudicator,
identified audio listeners, a clean unseeded Windows x64 target and the
owner's eventual desktop decision. For rollback, `1fddf01c70b44bc9d5802d334c80f0b68bcd9223`
is the prior Translate published baseline: revert only scoped commits
`3fff22f` and `82b824f` on a new branch and republish its report. The
original sources, historical failed experiments, Auralis voice worktree and
unrelated architecture edit must remain untouched.
