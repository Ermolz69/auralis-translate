# Release readiness self-audit after REG-010: incomplete

Date: 29 September 2026. This audits the committed Translate engineering
candidate `c695c93150789121bc3dc335b38bf5ea29fc4a04` against the frozen
[PLAN-03 scope](2026-09-28-goal-scope-v1.md) and
[release acceptance](../../docs/RELEASE_ACCEPTANCE.md). It is a **self-audit
of an incomplete candidate**, not the final `RELEASE-05` sign-off. The older
[handoff](2026-09-29-release-readiness-handoff.md) remains as historical
evidence. Required backlog tasks are not reclassified as done.

## Exact checked identities

- Translate `main` at `c695c93`; both new commits `42af7c4` and `c695c93`
  have `Ermolz <00ermzahar@gmail.com>` as author and committer. The owner's
  unrelated change to `docs/architecture/014-result-history-selection.md`
  remains unstaged. Source files, older checkpoints and earlier reports were
  not altered.
- REG-010 model Hy-MT2 1.8B Q4_K_M SHA-256
  `dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699`;
  llama-server SHA-256
  `6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`;
  v6 profile SHA-256
  `b30546f228ba230364ba79edae55456d62e7d7c5010e56fef38464c3531089c5`.
  This measured development profile is not selected for release.
- Auralis real-SAPI pilot work stays in the isolated local worktree at
  `0afa465eb46e029b7cce2f2421a5324a7f2522ef` on
  `feat/real-tts-pilot`; it is not a pushed production integration or an
  approved spoken-script pipeline. The Auralis primary checkout and its
  Translate submodule pin were not advanced by this slice.
- GitHub Pages workflow
  [36562184618](https://github.com/Ermolz69/auralis-translate/actions/runs/36562184618)
  succeeded for `c695c93`. The public HTTP 200 document was byte-identical
  to `site/index.html`, SHA-256
  `4db641f7c3e26b3a0b553c56fa1d08426c81f4855bfd2bc2360dc8dd817f2e8c`.
  It contains the Tailwind CDN and REG-010 section. A later documentation
  publication must be verified independently.

## New defect and measured disposition

The archived v6 synthetic 1,024-cue output is structurally complete after
copied-state recovery but has 665/1,280 exact-code losses or changes. Cue 129
also copied the *next cue's meaning* while retaining its own JSON slot. Its
target time `08:10` disappeared. [REG-010](2026-09-29-reg-010-neighbor-content.md)
pins that raw response, a minimal reproduction, four same-pattern archived
controls, wrong-time/duplicate-time controls and negative controls. New
checkpoints persist an advisory `time_mismatch` warning; historical results
stay unchanged. This improves triage but does not correct model meaning.

The bounded real-model comparison used five same-source pairs and three seeds,
30 requests, one context factor and no retries. Both arms had 15/15 valid
slots, exact identifiers and explicit time; the old failure did not recur.
The outcome is **inconclusive**, so no global no-context policy was adopted.
The [summary](../reports/2026-09-29-reg-010-neighbor-context-summary.json),
[30 raw requests](../reports/2026-09-29-reg-010-neighbor-context-requests.jsonl.gz)
and [resource samples](../reports/2026-09-29-reg-010-neighbor-context-resources.jsonl.gz)
remain immutable. Repeated synthetic cues and machine facts do not establish
natural narrative quality or independent language adequacy.

## Gate audit

| Gate | Observed evidence and missing release condition | Result |
| --- | --- | --- |
| G1 structure | Synthetic strict-SRT mapping and protected bytes checked; no exact final candidate on admitted natural complete sources | Open |
| G2 coverage | Synthetic 1,024 cues / 1,280 lines complete after recovery; 665 code fact errors and cue-129 content substitution; no accepted natural result | Open |
| G3 adequacy | No eligible independently reviewed sealed 300-cue denominator; machine/code checks cannot score 4/5 adequacy | Open |
| G4 critical errors | No independent source-aware holdout adjudication; confirmed development major content substitution unresolved in model | Open |
| G5 terminology | Scoped term admission and short probes exist; no final approved-term denominator, names/money review or human inflection adjudication | Open |
| G6 resources | REG-010 85,290 ms for 30 short requests and sampled process/GPU memory; no frozen SLA or complete natural-source resource/cancellation result | Open |
| G7 recovery | Copied-state recovery and SQLite warning persistence tested; host publication, edit, pause, disk/OOM and full declared fault matrix incomplete | Open |
| G8 export | Synthetic offline re-export checked; selected consumer verification for final complete result absent | Open |
| G9 installation | No unseeded offline Windows x64 target; owner-deferred desktop review workflow not scheduled | Open |
| A1 approved lineage | Verified selection/revalidation fixtures; no independently reviewed translation or approved spoken script | Open |
| A2 complete real speech | Two genuine SAPI WAVs and private short synthetic media; no approved complete scene or production worker | Open |
| A3 sound and fit | Two accelerated segments fit original cue windows at 2,316/2,400 and 1,812/1,900 ms; no accepted fit limits or human listening | Open |
| A4 listening | Zero of three distinct 10–20-minute source-aware listener-reviewed scenes | Open |
| A5 full-length durability | No rights-admitted complete natural media or full audio fault/restart matrix | Open |
| A6 delivery | Synthetic MP4 decoded and FFplay process completed; no final rights-cleared media played and judged in declared consumers | Open |

These are gaps, not measured failures on a qualified final holdout or approved
voice pilot. `RELEASE-01`–`RELEASE-03`, `RELEASE-05`, `DATA-04`–`DATA-05`,
`LONG-04`–`LONG-06`, `HOST-02`–`HOST-04` and `VOICE-04`–`VOICE-07` remain
unmet. G1–G9 and A1–A6 do not pass. The final `RELEASE-05` requires one
selected profile, complete artifacts, reviewed severity disposition and a
clean target; no selected release identity exists yet.

## Checks, external needs and rollback

The REG-010 slice passed `task test:time-diagnostics`,
`task eval:reg010:context:check`, `task eval:reg010:context:probe`,
`task eval:reg010:context:capture
REPORT_DIR=.cache/eval/reg010-neighbor-context/run-GzXjPn`,
`task eval:reg010:context:result:check`, `task eval:regression:check`,
`task fmt`, `task lint`, `task docs:check`, `task plan:check`,
`task site:build` and `task site:check` on the affected code/evidence.
The first sandbox-only `spawn EPERM` regression attempt was rerun with process
permission and passed; no model request was lost or hidden.

External input is still required: a rights-verified Mandarin subtitle/video
source set with at least roughly 200 development and 300 sealed eligible
holdout cues, three distinct 10–20-minute scenes and a complete natural
source; an independent Chinese/Russian reviewer with dispute adjudication;
identified listeners and script approval; an unseeded Windows x64 machine;
and the owner's scheduling decision for the deferred desktop UI. The
discovered 365 Commons cues have not passed source/rights/standard-Mandarin
admission. Their mere existence does not fill these needs.

The prior Translate report baseline `c57f157` and Auralis voice baseline
`c788ddc` remain recoverable in Git. To undo this REG-010 slice, review and
revert `c695c93` then `42af7c4`, preserving archived evidence and the
owner's unstaged file; do not reset either primary checkout, rewrite SQLite
history, delete original media, or advance the Auralis submodule blindly.
Future independent work can proceed on context/long-file engineering and
voice worker integration, but neither a CLI milestone nor a synthetic audio
clip completes this Goal.
