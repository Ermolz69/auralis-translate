# RELEASE-05 audit attempt: release withheld

Date: 1 October 2026. Auditor: project agent, self-audit only. The [PLAN-03
scope](2026-09-28-goal-scope-v1.md) remains frozen: Chinese strict SRT to a
separate Russian file on Windows, native Auralis selection/review and an actual
source-subtitle dubbing pilot. Japanese, subtitle-free ASR and strict WebVTT
release claims are outside this scope. The desktop milestone remains deferred
pending the owner's separate scheduling decision. This audit does not turn a
CLI development result into a final release candidate.

## Candidate and provenance

The audited committed Translate checkout was `2a7073e99faf8e3f5e70b1ee861acc1a2bbae3d2`
on `main`, published to `origin/main`. The pre-existing unrelated edit to
`docs/architecture/014-result-history-selection.md` was excluded from every
commit. The locally built release CLI has SHA-256
`4bbe8ec9878498d8c6ea085c33801b52dbcd7732caa532cffba3e939e5be7eb7`;
the post-commit private build receipt at
`.cache/eval/release-cli-build-receipts/receipt-6dd9156e-35ff-4b4f-a8ed-9459ccf24cdc.json`
has SHA-256 `d0c01349bc249189dabf65da78a62df575984f931ba8d0746852e15e3d6831f1`.
This is a local binary and receipt, not a clean-target installer.

The real 263-cue development run used Hy-MT2 7B Q4_K_M SHA-256
`9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b`,
llama-server SHA-256
`6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`,
and v6 manifest SHA-256
`268c4d00eee8994936d7019d4cad47a5193a01e459ad9ed4214ea30facd102f9`.
Its source SRT SHA-256 is
`4777e11caa115e893f2328c2a33c25a76c7391ace8ecf0ac4b9436635fc27964`;
matched video SHA-256 is
`6e29f1512a76f553bdfc1678f458a69cf010e4653ac3f1cdfc4c45742bfb39d6`.
The run was built from committed source `bf68147c0a366a7ce4683841d12058fe5ae13fb4`;
the later commits add evidence/reporting and retain the same CLI hash. The
[frozen plan](2026-10-01-sethlui-json-tail-length-retry-plan.md),
[result](2026-10-01-sethlui-json-tail-length-retry-result.md) and private raw
report SHA-256
`5bbe00880f6e22a3d9831eddf1404f7c4a51503ed29809325294dd56cd82ddd0`
retain the exact requests, responses, attempts, token counts and timing.
Neither this source nor the model has been admitted as the final candidate.

## Translation gate decisions

| Gate | Exact observed evidence | Release decision |
| --- | --- | --- |
| G1 structure | 263/263 source cues, cue IDs, timing and protected SRT structure verified; original source immutable; separate result SHA-256 `45f140e201f5a6228a0754e48d1e2b4153a392a7869dc279768339882fa53511` | Development file passes the structural check; final admitted corpus/endpoint is absent. Open. |
| G2 coverage | 263 contiguous checkpoints, one result row and 263/263 explicit output slots; no partial result from the two failed 7B attempts | Development file complete; no final selected candidate. Open. |
| G3 adequacy | 0 eligible independently reviewed holdout cues; required threshold is at least 95% rated 4/5 or higher | Fail: no denominator or human score. |
| G4 critical errors | 0 independent source-aware adjudications. AI triage found a wrong dim sum role and inconsistent venue name; `REG-044` retains controls | Fail: zero-critical-error claim unavailable. |
| G5 terminology | No approved venue term or applicable-term denominator; the same source name has three Russian renderings at cues 130/219/262 | Fail: 98% threshold unmeasured. |
| G6 resources | 308.207 s CLI, 71,212 prompt and 10,259 completion tokens; sampled peak server RAM 5,072,789,504 B and whole-device GPU 6,906 MiB | Measured on the local host only; no frozen final SLA, selected model or cancellation/resource-release matrix. Open. |
| G7 recovery | One rejected cue-62 response caused one identical-request retry, with 263 durable checkpoints; earlier failed 61-prefix runs retained | Partial; final-candidate fault, interruption and upgrade/rollback matrix not passed. Open. |
| G8 export | Offline re-export after server shutdown is byte-identical to the result SRT | No complete declared target-consumer matrix or approved lineage. Open. |
| G9 installation | No unseeded Windows installation through the final native delivery endpoint | Fail. |

The source inventory has 11 technical candidates and 2,993 inspected Chinese
cues, with **zero eligible** for the sealed release holdout. The licensed
Paywall documentary has English speech, so its Chinese subtitle track does
not establish Chinese speech alignment. The restaurant source's subtitle/audio
rights and actual speech alignment remain unreviewed. `DATA-03`–`DATA-05`,
`LONG-01`–`LONG-06`, `DECIDE-01`, `HOST-01`–`HOST-04` and
`RELEASE-01`–`RELEASE-03` have unfinished acceptance; this audit cannot mark
`RELEASE-05` done despite the completed local file. The 1.8B/7B same-source
[comparison](2026-10-01-sethlui-json-tail-length-retry-result.md) improves
selected name and amount retention with 7B but also records its remaining
errors. It is AI inspection, not independent review. No fine-tuning or higher
precision decision is justified without `DECIDE-01`.

## Audio gate decisions

| Gate | Exact observed evidence | Pilot decision |
| --- | --- | --- |
| A1 lineage | Auralis has a selected-result/spoken-script contract, but zero independently approved Chinese-to-Russian translation or script | Open. |
| A2 real speech | Auralis retained 268 real Microsoft Irina Desktop SAPI cue WAVs and playable media for an unreviewed ASUS draft | Technical synthesis only; no approved segments. Open. |
| A3 sound and fit | Raw media has 264/268 cue overruns and 259 speech-start overlaps; at 1.5× mathematical fit, only 47/268 windows fit after a 75-ms margin | Fail; no approved fit, loudness or semantic-preserving edit policy. |
| A4 listening | Zero independent listeners and zero approved 10–20-minute Chinese-speech scenes; three distinct scenes required | Fail. |
| A5 durability | No approved complete natural-source dubbing run with restart/cancellation matrix | Open. |
| A6 delivery | Full technical FFplay playback of the draft media was observed; no approved script, listening result, rights clearance or selected consumer decision | Open. |

The [Auralis fit record](2026-10-01-asus-audio-fit-feasibility-result.md)
retains the exact voice and source identities. Auralis's primary checkout has
unrelated in-progress changes; this audit neither stages nor changes them.

## Checks, publication and disposition

On the committed Translate candidate, `task test:json-tail:retry`,
`task eval:natural:sethlui:v6:7b:length-tail:result:check`,
`task eval:regression:catalog:check`, `task lint`, `task fmt`,
`task eval:cli:build:receipt`, `task docs:check`, `task plan:check`,
`task site:build` and `task site:check` passed. These checks verify the
declared engineering slices, not G3–G5, G9 or A1–A6. `REG-043` covers the
length-limited wrapper loop with related and negative cases; the real full-file
run exercised the completed-response retry, not the length-specific branch.
The earlier failed v1 screen, original 7B screen and copied-state continuation
remain retained as failures.

The GitHub Pages workflow for `2a7073e` [succeeded](https://github.com/Ermolz69/auralis-translate/actions/runs/36894140559).
`task site:live:check` compared the published HTML byte-for-byte with the
committed `site/index.html`: 1,111,494 bytes, SHA-256
`1683c0d8f35b8ec3640faf0440d0717a28562994abc1a9df43b1cbd315127b45`.
The [live report](https://ermolz69.github.io/auralis-translate/?revision=2a7073e99faf8e3f5e70b1ee861acc1a2bbae3d2)
retains earlier measurements and excludes private restaurant subtitle text.
All nine new Translate commits use the verified primary global Git identity
`Ermolz <00ermzahar@gmail.com>` for author and committer.

**Decision: RELEASE-05 fails; Goal remains incomplete.** No final package,
notices, approved script, clean install or release artifact exists to hash or
roll back. The previous committed `1ca7826edadca4553c5e736f08dc7169b3152adc`
is the Git/report baseline; the historical 1.8B result and failed 7B states
remain separate immutable experiment baselines. Reverting the nine Translate
commits on a new branch and republishing the prior site recovers the earlier
code/report state; it does not create a validated production downgrade.

The next external prerequisites are independently reviewable Chinese-speech
subtitle/video scenes with usage rights, a bilingual Chinese/Russian reviewer
and adjudicator, identified listeners, an unseeded Windows x64 target and the
owner's decision to schedule the deferred desktop slice. Until then, continue
bounded source admission, context/term checks, fault coverage and fit design
without weakening the frozen gates or publishing private media.
