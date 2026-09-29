# Release readiness self-audit: incomplete candidate

Date: 29 September 2026. This is a resumable self-audit against the
[frozen PLAN-03 scope](2026-09-28-goal-scope-v1.md) and
[release acceptance](../../docs/RELEASE_ACCEPTANCE.md). It is **not** the
final `RELEASE-05` audit: the exact selected release candidate, natural
source, independent reviewers, clean target and owner-deferred native UI
do not exist yet. `RELEASE-05` remains planned in the canonical backlog.

## Current identities and observations

- Translate `main` is `1687bd2`. The owner's unrelated edit to
  `docs/architecture/014-result-history-selection.md` remains unstaged.
  Auralis voice work is isolated on local `feat/real-tts-pilot` at `0afa465`;
  the main Auralis checkout and its Translate submodule pin remain untouched.
- The checked 1.8B v6 synthetic 1,024-cue result has 1,280 text lines and
  665 exact source-code losses/changes. It structurally completed only after
  a copied-state recovery and is not a language-quality pass. Its original
  [report](../reports/2026-09-29-long-v6-postlength-v2-report.json) and
  3,847-request [journal](../reports/2026-09-29-long-v6-postlength-v2-journal.json.gz)
  remain pinned. The [matched reminder screen](2026-09-29-reg-009-prompt-screen-results.md)
  kept 2/8 exact codes in each arm. A separate strict guard rejects code
  mismatch before checkpoint in fixtures; it is not a selected long-file
  profile. The [offline repair screen](2026-09-29-reg-009-prefix-repair-results.md)
  proposed 656 exact-code insertions from archived responses, leaving nine
  mismatches and a wrong-content cue. It is unselected and unreviewed.
- Real SAPI generated two Russian WAVs. A private synthetic H.264/AAC clip
  using the original cue windows was decoded and played by FFplay after
  measured 1.533× and 1.736× tempo factors. The [machine evidence](2026-09-29-sapi-original-window-fit.md)
  records 2,316/2,400 and 1,812/1,900 ms, zero sampled clipping and no
  listener judgment. Auralis speech bytes remain private. No natural scene,
  reviewed script or production media worker was used.
- The [public report](https://ermolz69.github.io/auralis-translate/)
  retained 420 historical requests and later failure evidence. GitHub Pages
  run `36558898054` completed successfully for `1687bd2`. The live HTTP 200
  document matched local `site/index.html` SHA-256
  `8a7c2756433f6fba3b0e47b1c3a5138b4e459fcfd560fdd0f525321f8152d9c2`.

## Gate disposition

| Gate | Current evidence | Disposition |
| --- | --- | --- |
| G1 structure | Synthetic SRT structural recovery and original-byte checks; no final candidate on natural complete sources | Open |
| G2 coverage | One 1,024-cue synthetic artifact; 665 source-code fact losses and no accepted natural complete file | Open |
| G3 adequacy | Zero of the required 300 eligible independently reviewed sealed holdout cues | Open |
| G4 critical errors | No independent source-aware adjudication on a sealed holdout | Open |
| G5 terminology | Term admission and short probes exist; no approved-term release denominator or human name/money review | Open |
| G6 resources | Request and process measurements exist; no frozen numeric SLA or complete natural-source lease/cancellation result | Open |
| G7 recovery | Copied-state checkpoint recovery measured; declared fault, edit and host publication matrix incomplete | Open |
| G8 export | Synthetic offline re-export matched bytes; declared target-consumer behavior unverified | Open |
| G9 installation | No unseeded offline Windows target or final native endpoint; owner-deferred UI unscheduled | Open |
| A1 approved lineage | Selection/revalidation fixture exists; no independently reviewed translation and approved spoken script | Open |
| A2 complete real speech | Two real SAPI segments and private synthetic media only; no complete approved scene | Open |
| A3 sound and fit | Original-window tempo candidate decodes without clipped samples; no accepted fit limit or listener approval | Open |
| A4 listening | Zero of three distinct 10–20-minute reviewed scenes; no identified listener ratings | Open |
| A5 full-length durability | No complete licensed natural media source or audio restart matrix | Open |
| A6 delivery | FFplay process completed on synthetic media; no rights-cleared final export and declared consumer/listener check | Open |

These are status gaps, not failed scores on an eligible final candidate.
Compilation, fixture checks, machine RMS and player completion do not fill
human language or listening denominators.

## Required external inputs and next independent work

1. Supply or approve a license-verified complete Mandarin subtitle/video
   source set, with separate subtitle, video and synthesized-audio rights,
   including roughly 200 development cues, 300 sealed holdout cues, three
   distinct 10–20-minute scenes and a complete natural source. The 365
   discovered Commons cues are unadmitted candidates, not eligible data.
2. Identify an independent Chinese/Russian reviewer and a second reviewer
   for disputed critical errors; provide source-aware holdout scoring and
   approved spoken-script review. Identify listeners for the accelerated
   private MP4 and later natural scenes.
3. Provide an unseeded Windows x64 target for offline G9 and choose when to
   schedule the owner-deferred desktop review/selection workflow. No silence
   or elapsed time authorizes either decision.
4. Continue independent `CTX-02`, `EVAL-04`, `LONG-01` and `VOICE-01`
   engineering work under the backlog. Select a candidate and quantitative
   G6/A3 limits only after same-source measurements and review. Training and
   higher precision remain conditional on `DECIDE-01`.

Rollback has not been performed. The previous Translate report commit
`c57f157` and prior Auralis voice branch commit `c788ddc` remain in Git.
Revert only the relevant new commits after preserving their evidence; do not
reset the owner's dirty checkout, delete original sources or modify the
historical SQLite/result archives. A future final `RELEASE-05` must audit a
committed exact candidate, target install and the full G1–G9/A1–A6 dossier.
