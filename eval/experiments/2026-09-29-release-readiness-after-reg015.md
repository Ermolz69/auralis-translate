# RELEASE-05 self-audit after REG-015: incomplete

Date: 29 September 2026. This audits the committed Translate engineering
candidate `617ebb076283adc7d24592f2074ef5d2d1c82f2a` against the frozen
[PLAN-03 scope](2026-09-28-goal-scope-v1.md), [release acceptance](../../docs/RELEASE_ACCEPTANCE.md)
and [previous detailed self-audit](2026-09-29-release-readiness-after-reg010.md).
There is **no selected release candidate**. This is not the final independent
`RELEASE-05` sign-off. All required G1–G9 and A1–A6 gates remain open.

## Identity and publication

- Translate `main` commits `559b55b` and `617ebb0` use global
  `Ermolz <00ermzahar@gmail.com>` for both author and committer. The owner's
  unrelated `docs/architecture/014-result-history-selection.md` change remains
  unstaged. No source subtitles, older reports, checkpoints or accepted results
  were rewritten.
- The failed real 1,024-cue CLI run used Hy-MT2 1.8B Q4_K_M SHA-256
  `dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699`,
  llama-server SHA-256
  `6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`,
  checked v1 repair profile SHA-256
  `e80c80b0cf1db26d62ce5f644091f30e42fea752d27a0ce201fcab33f29ecb69`,
  and authored source SHA-256
  `e9b760bdcce97de9f29f5fe671dbb927088f5a15119ebe3200e73e0408391bb3`.
  The [summary](../reports/2026-09-29-reg009-long-cli-prefix-repair-summary.json)
  and [raw archive](../reports/2026-09-29-reg009-long-cli-prefix-repair-archive.json.gz)
  retain the full request, token, timing, memory, error and checkpoint record.
  The separate capture correction proves zero results and no SRT.
- Opt-in repair v2 manifest SHA-256
  `f7b355cd265e93c402eb94fc8e444dd92e48a4c9041d61d2e914388ca5b9147f`
  has a deterministic provider fixture only. It was not used for real inference
  or selected for release. V1 is retained for reproduction but has the
  [REG-015 mixed-script bypass](2026-09-29-reg-015-mixed-script-prefix-repair.md).
- Auralis real-SAPI development remains in its separate clean local worktree at
  `4230a53338c40fd2026b1b4a6fca3fa0e4d1850a` on `feat/real-tts-pilot`.
  The private branch was not pushed after automatic approval review rejected
  publishing the private Auralis source without explicit authorization. Its
  Translate submodule pin was not changed for this Translate-only repair.
- [Pages workflow 36586453645](https://github.com/Ermolz69/auralis-translate/actions/runs/36586453645)
  succeeded for `617ebb0`. The live HTTP 200 document at
  `https://ermolz69.github.io/auralis-translate/` matches `site/index.html`
  byte-for-byte, SHA-256
  `d8dbd7ea4a997e008e161b68829d1f0ebf8eafb9914dfc8feca416784d85738a`.
  REG-014/015, old measurements and `@tailwindcss/browser@4` are present.
  Desktop and 390 px browser views of the failure section were inspected; the
  mobile text and evidence links were visible without page-wide overflow.

## Decision against required gates

| Gate | Observed and missing evidence | Decision |
| --- | --- | --- |
| G1 structure | Synthetic strict-SRT mapping and protected bytes checked; no same-candidate complete admitted natural source | Open |
| G2 coverage | V1 CLI retained 88/1,024 checkpoints after stop/resume, then rejected cue 89; zero complete results or SRT | Open |
| G3 adequacy | No independently reviewed eligible 300-cue sealed holdout; 81-request development screen and fixture tests have no human 4/5 denominator | Open |
| G4 critical errors | Source-aware human adjudication absent; REG-010 wrong-neighbour meaning, REG-012 actor and REG-013 grammar remain | Open |
| G5 terminology | Term admission and scoped tests exist; no approved-term denominator, name/money inflection review or 98% human decision | Open |
| G6 resources | Failed CLI run: 111 chats, 32,934/4,569 prompt/completion tokens, p50/p95 2,486/3,112 ms, sampled working set 2,129,367,040 bytes; no frozen complete-source SLA | Open |
| G7 recovery | Intentional 16-block stop/resume and SQLite journal survived; complete fault, host, migration and resource-release matrix absent | Open |
| G8 export | Earlier synthetic offline byte-identical export; no final accepted natural result in target consumers | Open |
| G9 installation | No unseeded offline Windows target or final selected endpoint; desktop remains owner-deferred | Open |
| A1 lineage | Selection/revalidation fixtures and private TTS input exist; no human-approved translation, spoken script or speaker map | Open |
| A2 real speech | Two genuine SAPI WAVs decode; no complete approved scene or production audio worker | Open |
| A3 sound/fit | Synthetic 2,316/2,400 and 1,812/1,900 ms fitted segments require 1.533×/1.736× tempo; no accepted sound limits or listening | Open |
| A4 listening | Zero of three distinct 10–20-minute source-aware listener-reviewed scenes | Open |
| A5 full length | No rights-admitted complete natural media or full audio restart/cancellation matrix | Open |
| A6 delivery | Synthetic MP4 decoded and FFplay process completed; no final rights-cleared media played and judged in declared consumers | Open |

The relevant backlog tasks `DATA-03`–`DATA-05`, `CTX-02`–`CTX-04`,
`LONG-01`–`LONG-06`, `RELEASE-01`–`RELEASE-05`, `HOST-01`–`HOST-04` and
`VOICE-01`–`VOICE-07` retain their canonical non-done states. In particular,
the new REG-015 check does not make v1 safe for unattended release or make v2
a measured model solution. The 1.8B/7B screen found code gains for 7B and a
singular-door meaning regression, so neither model nor training/precision branch
is selected. Japanese and subtitle-free ASR remain outside PLAN-03.

## Checks, needs and rollback

The REG-015 slice passed `task test:source-prefix-repair` (11 adapter, four
core, one SQLite and one CLI test), `task eval:regression:catalog:check`
(15 versioned packs), `task eval:regression:check`, `task fmt`, `task lint`,
`task docs:check`, `task plan:check`, `task site:build` and `task site:check`.
The first regression invocation had sandbox `spawn EPERM`; its permitted rerun
passed. The first REG-015 adapter assertion intentionally failed on v1 before
v2 was implemented, preserving the minimum reproduction. No v2 model or new
audio request was made in this slice.

External inputs still needed: rights-cleared standard-Mandarin subtitles and
matching video with about 200 eligible development and 300 independent sealed
holdout cues, three distinct 10–20-minute scenes and one complete natural
source; an independent Chinese/Russian reviewer and adjudication; approved
spoken scripts with named human listeners; an unseeded Windows x64 target; and
the owner's scheduling decision for the deferred desktop release slice. The
discovered Commons candidates have not passed these admission checks.

Rollback keeps all original media, SQLite history and raw reports. For this
slice, revert `617ebb0` then `559b55b` after review, leaving the owner file
untouched. The prior checked v1 profile and baseline remain addressable by
their hashes. The Auralis local branch can be left unselected; do not move its
submodule pin or reset the primary checkout as an incidental rollback.
