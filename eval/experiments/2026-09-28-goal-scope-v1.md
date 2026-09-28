# Goal execution scope v1

Frozen: 28 September 2026. Task: `PLAN-03`. This is a finite acceptance target,
not evidence that any release gate has passed.

## Product and endpoint

- Chinese source subtitles to Russian. Japanese and ASR without source subtitles
  are excluded future directions.
- Strict plain SRT is the release grammar. Preserve the original and publish a
  separate versioned result. Existing strict WebVTT remains subject to applicable
  change-triggered regression checks, but has no independent G1–G9 release claim
  in this scope. This bounds the natural corpus and consumer matrix.
- Target Windows 10 x64 on the local RTX 3070 development machine, then an
  unseeded Windows x64 installation target. No VRAM or speed promise is inferred
  from the model file size.
- CLI is the first implementation/experiment endpoint. The full release includes
  Auralis's native selection/review path and clean-target offline package.
  `HOST-03` and `RELEASE-03` remain required but owner-deferred until an explicit
  scheduling decision. A CLI milestone cannot close `RELEASE-04` or this Goal.
- Auralis must take an explicitly selected, independently reviewed translation,
  create a reviewed spoken script, synthesize real Russian speech, fit it and
  export playable media. The pilot covers three distinct 10–20-minute scenes and
  one complete natural source with restart/cancellation evidence. Subtitle and
  audio rights are admitted separately.

## Required tasks and gates

`BASE-01`–`BASE-03` and `PLAN-01`–`PLAN-02` are accepted only for their linked
narrow scopes. The following IDs are required for this Goal:

| Milestone | IDs | Acceptance |
| --- | --- | --- |
| Planning/data | `PLAN-03`, `DATA-01`–`DATA-05`, `EVAL-01`–`EVAL-02` | Rights, grouped splits, references, sealed holdout and independent review |
| Context/checks | `CTX-01`–`CTX-05`, `EVAL-03`–`EVAL-04` | Versioned v5, retained v1–v4, paired real outputs and maintained regressions |
| Long translation | `LONG-01`–`LONG-06`, `DECIDE-01` | Token-counted batches, seams, natural-file review, faults, SLA and model choice |
| Native release | `HOST-01`–`HOST-04`, `RELEASE-01`–`RELEASE-05` | G1–G9 on one final candidate, clean install, rollback and committed audit |
| Real dubbing | `VOICE-01`–`VOICE-07` | Reviewed lineage and real TTS satisfy A1–A6, listening, full source and playback |

`RELEASE-01` binds G3–G5; `RELEASE-02` binds G1/G2/G6–G8; `RELEASE-03` binds
G9 and the native endpoint. `RELEASE-05` audits a committed candidate before
`RELEASE-04` can decide release. `VOICE-06` records a separate audio decision.
Exact denominators, artifact hashes and reviewer provenance follow
[release acceptance](../../docs/RELEASE_ACCEPTANCE.md).

`TUNE-01`–`TUNE-03` and `PRECISION-01` are conditional on `DECIDE-01` measuring
persistent errors and resource headroom. No training or higher precision run is
authorized by this record alone. `LANGUAGE-01` and `ASR-01` are excluded. A later
WebVTT release requires a separate scope and format-specific gate evidence.

## Inventory and bounded resources

Translate begins at `0bdd1ce` on `main` with an unrelated local edit in
`docs/architecture/014-result-history-selection.md`. Auralis begins at `d962025`
on `refactor/maintainable-boundaries`, 93 commits ahead of its remote and with
unrelated work in progress. Its pinned Translate submodule is `1b888d0`.
Cross-repository changes must reconcile that pin without staging unrelated work.
The primary global Git account is `Ermolz`; verify author and committer again
before each commit.

The current machine reports RTX 3070, 8,192 MiB VRAM, driver 595.79, compute
capability 8.6 and 846 MiB in use at inventory. E: has about 724 GB free.
Current RAM telemetry was denied by the OS query; the prior matched-model
[record](2026-09-27-model-size-comparison.md) reports approximately 48 GiB.
`task` 3.50.0, Rust 1.95.0 and Node 24.14.0 are available. Local pinned Hy-MT2
1.8B and 7B Q4_K_M files have the expected sizes of 1,133,080,448 and
4,624,648,896 bytes. Their manifests declare SHA-256 values
`dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699`
and `9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b`,
prompt v4, 2,048 context tokens and runtime `b10977-0ecb159c9`. File size is
not a fresh hash or runtime check. The existing matched comparison is a
development baseline, not a final model or human quality gate.

Local inference and bounded owned-fixture probes are available. No rented GPU,
paid API, purchased corpus or external TTS service budget is authorized. Each
experiment freezes its request/token/time/resource limits and stop criteria before
execution. No global time budget or release date was supplied. The final model,
backend, tokenizer, v5 policy, TTS engine, fit limits and numeric G6 SLA remain
open until measured.

## External prerequisites

1. An independent Chinese/Russian reviewer, plus a second reviewer for disputed
   critical findings, must score sealed cues and source-aware long-file samples.
   AI editorial analysis is labelled separately.
2. Licensed complete Chinese subtitle/video sources with separate subtitle and
   audio rights are needed for the natural corpus, pilot scenes and full audio
   soak. Public excerpts need redistribution rights.
3. A clean unseeded Windows x64 target is needed for G9, including actual offline
   translation through the final endpoint.
4. The owner must explicitly schedule the deferred native UI slice before full
   release. This Goal request does not override the stated deferral.
5. Listening and media playback need identified listeners and consumers. A
   decodable file alone is not perceptual approval.

Continue independent implementation while inputs are pending. Do not lower a gate,
reuse a tuned holdout or invent approval. Material scope changes require a new
versioned record preserving this one and naming invalidated evidence.

## PLAN-03 acceptance

This record freezes scope, required/conditional/excluded IDs, gate mapping,
resources, candidate uncertainty and external needs. `task plan:check` passed
with 49 unique tasks, valid dependencies and linked completion evidence;
`task docs:check` passed with 100 local Markdown files. `task site:build` retained
180 historical and 240 model-comparison requests, and `task site:check` passed
report identity, script and single-file checks. These are planning/publication
checks only. G1–G9 and A1–A6 remain open until observed on the exact candidate
and target.
