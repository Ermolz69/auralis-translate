# RELEASE-05 interim self-audit: 7B complete structural restaurant file

Date: 1 October 2026. This continues the [frozen PLAN-03 scope](2026-09-28-goal-scope-v1.md)
and [Paywall source audit](2026-10-01-release-readiness-after-paywall-source.md).
It is not a final `RELEASE-05` decision. The exact v2 release CLI, model,
runtime, source and manifest are recorded in the
[bounded result](2026-10-01-sethlui-json-tail-length-retry-result.md).

The 7B model created a separate, structurally valid 263/263 Russian SRT on the
same 12:18 Chinese restaurant source previously completed by 1.8B. One
identical-request retry at cue 62 rejected a leaked JSON tail and saved a clean
second answer. Raw requests, responses, tokenizer counts, 263 checkpoints,
result lineage and offline byte-identical export were verified. This supports
long-file and bounded-retry engineering, not translation adequacy. The
rights-unreviewed source has no independent Chinese–Russian reviewer or
human speech alignment. `REG-044` records one source venue name rendered three
ways in the accepted 7B text; the dim sum role remains mistranslated under AI
inspection. The new length-specific retry branch passed deterministic tests
but was not exercised by this real-model run.

| Gate | Observed evidence and unresolved requirement |
| --- | --- |
| G1–G2 | Original source preserved and a separate 263-cue SRT passed structural checks; no selected final candidate, admitted natural corpus or reviewed publication decision. |
| G3–G5 | Zero eligible holdout cues, zero independent bilingual ratings, no approved venue term or source-aware full-file review. AI triage has unresolved role/name errors. |
| G6 | 308.207 s CLI translation on this host, 71,212 prompt and 10,259 completion tokens, sampled peak process RAM 5,072,789,504 B and whole-device GPU 6,906 MiB. One run cannot set the final model, SLA or target resource envelope. |
| G7–G8 | Earlier copied-state recovery and this validated offline export exist; exact final-candidate crash/upgrade/consumer matrix remains incomplete. |
| G9 | No clean unseeded Windows install and offline final-endpoint translation; native desktop stage remains owner-deferred. |
| A1–A3 | Auralis has real SAPI technical pilot evidence, but this translation is unreviewed and cannot be an approved spoken script; source/audio rights and fit remain open. |
| A4–A6 | No independent listeners or three approved natural 10–20-minute scenes. Full ASUS playback proves technical decoding only and its timing fit is poor. |

The new report and earlier failed prefix remain separate, with exact hashes and
no discarded attempts. `task eval:natural:sethlui:v6:7b:length-tail:result:check`,
`task test:json-tail:retry` and `task eval:regression:catalog:check` passed.
The task still needs licensed Chinese-speech sources admitted by scene,
independent bilingual and listening assessments, a clean Windows target and
the owner's explicit desktop scheduling decision. Until those gates and the
full `RELEASE-05` committed-candidate audit pass, the Goal remains incomplete.
