# Tracked implementation backlog

Updated: 2026-09-28. Canonical task state for the
[delivery plan](DELIVERY_PLAN.md). This replaces the temporary S0–S9 work queue;
their product/format acceptance criteria remain applicable. Historical evidence
is in [implementation status](IMPLEMENTATION_STATUS.md).

## Status and accounting rules

- `done`: named acceptance verified with linked evidence; its scope is not expanded by implication.
- `ready`: prerequisites are done and the next bounded slice can begin.
- `in_progress`: an agent is implementing the named slice; record what remains.
- `planned`: waiting for dependencies or scheduling; no implementation claim.
- `deferred`: conditional work or work intentionally postponed by the owner.
- `blocked`: a concrete external prerequisite is missing; record it and the unblock action.

Each ID is stable. Dependencies are comma-separated IDs or `-`. Done tasks must
link an evidence/acceptance record. Change state and evidence with the associated
implementation; never mark a gate done from mocks or compilation. Add new tasks
rather than broadening a completed task. `ready` and `done` require all declared
prerequisites done. Release readiness is determined by gates, not done/total.
Optional adaptation does not block a successful unadapted translation release.
The [release acceptance map](RELEASE_ACCEPTANCE.md) defines finite goal scope,
G1–G9/A1–A6 and the final audit. The [regression policy](evaluation/008-regression-and-adversarial-checks.md)
defines future-check maintenance. The [reusable goal objective](GOAL_PROMPT.md)
does not activate implementation by being stored here.

## Task table

| ID | Work | Status | Depends on | Acceptance / evidence |
| --- | --- | --- | --- | --- |
| BASE-01 | Strict source/result and checkpoint foundation | done | - | Narrow implemented slices only; open S7–S9 retained in [status](IMPLEMENTATION_STATUS.md) |
| BASE-02 | Real synthetic long-file recovery baseline | done | BASE-01 | Existing bounded scope and [recovery evidence](../eval/experiments/2026-09-26-long-file-recovery.md) |
| BASE-03 | Matched 1.8B/7B development comparison | done | BASE-01 | 240 real requests, AI editorial review and [experiment](../eval/experiments/2026-09-27-model-size-comparison.md) |
| PLAN-01 | Delivery plan, canonical progress and agent rules | done | BASE-03 | Documents/generated task progress; plan/docs/site and browser DOM checks passed; [acceptance record](../eval/experiments/2026-09-28-delivery-plan.md) tracks publication |
| PLAN-02 | Audit planning gaps and define goal completion | done | PLAN-01 | Release/regression/goal contracts, 49-task dependencies, six document identities and checked progress; [audit record](../eval/experiments/2026-09-28-goal-plan-audit.md) |
| PLAN-03 | Freeze finite execution scope and gate bindings | done | PLAN-02 | [Scope v1](../eval/experiments/2026-09-28-goal-scope-v1.md): required/optional/excluded IDs, resources, gate bindings and external prerequisites; deferred UI remains required |
| DATA-01 | Source rights, provenance, scene and split schema | done | BASE-03 | [Inventory v1](reference/source-inventory-v1.md), authored [checked example](../eval/corpora/source-inventory-example-v1.json), six semantic tests and fixture SHA; real sources remain open |
| DATA-02 | Sixty context contrast cases | done | DATA-01, CTX-01 | [Corpus acceptance](../eval/experiments/2026-09-28-context-contrasts-v1.md): 60 targets, 240 paired scenarios, frozen IDs/hash and source-only request projection; AI-authored development data, no human score |
| DATA-03 | Licensed development subtitle scenes | in_progress | DATA-01 | [Commons Ying acquisition](../eval/experiments/2026-09-29-commons-ying-source-acquisition.md) and [two-speaker Guiyangese acquisition](../eval/experiments/2026-09-29-commons-guiyangese-source-acquisition.md) pinned and structurally inspected 159 natural Chinese candidate cues in controlled storage; exact text rights, speech alignment, scene/speaker boundaries, independent references, standard Mandarin and approximately 200 eligible cues remain open |
| DATA-04 | Sealed independent release holdout | ready | DATA-01, EVAL-01 | At least 300 eligible cues; independent groups/references, no tuning exposure; reviewer/source admission still needed |
| DATA-05 | Audit alignment, leakage and reviewer coverage | planned | DATA-03, DATA-04 | Whole-source duplicates/splits, reference provenance, rights, exclusions and balanced review categories checked |
| EVAL-01 | Blind review, scoring and adjudication protocol | done | BASE-03 | [Protocol v1](evaluation/009-blind-source-review.md): source-aware rubric, critical taxonomy, denominators, adjudication and explicit reviewer absence; no human score claimed |
| CTX-01 | Specify composable prompt v5 | done | BASE-03 | [v5 contract](reference/chinese-context-profile-v5.md): source-only scene windows, approved terms, fidelity, identity, token budget and strict slot mapping; documentation checks only |
| CTX-02 | Implement v5 without changing v1–v4 | in_progress | CTX-01, DATA-02, CTX-05 | [V5 envelope](../eval/experiments/2026-09-28-v5-envelope-evidence.md), [scene-map checks](../eval/experiments/2026-09-28-scene-map-admission.md), [paired real scenes](../eval/experiments/2026-09-28-scene-context-results.md), [failed actor-number instruction](../eval/experiments/2026-09-28-scene-number-repair-results.md), [term admission](../eval/experiments/2026-09-28-v5-terms-admission.md), [real paired term probe](../eval/experiments/2026-09-28-v5-terms-paired-results.md), [typed retry regression](../eval/experiments/2026-09-28-typed-provider-retry.md), [inference journal checks](../eval/experiments/2026-09-29-inference-request-journal.md), [HTTP error-body regression](../eval/experiments/2026-09-29-inference-http-failure-body.md), [real paired journal run](../eval/experiments/2026-09-29-inference-journal-paired-results.md), [7B actor-number screen](../eval/experiments/2026-09-29-context-7b-p01-screen-results.md), [real token-preflight journal](../eval/experiments/2026-09-29-inference-preflight-p01-results.md), [four-scene cross-model comparison](../eval/experiments/2026-09-29-pronoun-cross-model-results.md) and [inconclusive target-slot schema ablation](../eval/experiments/2026-09-29-slot-schema-ablation-results.md): source-scoped ledger, frozen prompt identity, transient-only bounded retry and CLI v5 chat plus tokenizer-attempt persistence implemented and verified on authored short scenes; both model sizes repeat the singular actor defect, while pre-attempt model verification and Auralis host attempt persistence, long-file quality and human review remain open |
| CTX-03 | Scene terms and speaker evidence | planned | DATA-03, CTX-01 | [Term admission](../eval/experiments/2026-09-28-v5-terms-admission.md) is an engineering contract only; independent terminology review and speaker evidence remain open |
| CTX-04 | Paired context/model ablation | planned | CTX-02, CTX-03, EVAL-01 | Budgeted repeated 60-case comparison, unrelated/insufficient-context controls and blinded review |
| CTX-05 | Specify bounded failure, retry and review policy | done | CTX-01, EVAL-02 | [Policy v1](reference/bounded-failure-policy-v1.md) and [invalid-slot retry regression](../eval/experiments/2026-09-28-invalid-slot-retry.md); typed provider errors/raw attempts remain for CTX-02 |
| EVAL-02 | General comparison and evidence schema | done | CTX-01, EVAL-01 | [Record v1](evaluation/010-comparison-record-v1.md), fixture-only [example](../eval/reports/experiment-record-example-v1.json) and seven schema tests; real comparisons remain open |
| EVAL-03 | Context and long-file HTML presentation | planned | EVAL-02, CTX-04 | Same evidence identities; scene/target/seam views, review labels, counts, public rights and raw downloads |
| EVAL-04 | Implement maintained regression and adversarial tiers | in_progress | CTX-01, EVAL-02 | [Initial index](../eval/experiments/2026-09-28-regression-index-v1.md), [REG-002 scene actor evidence](../eval/experiments/2026-09-28-scene-context-results.md), [failed instruction repair](../eval/experiments/2026-09-28-scene-number-repair-results.md), [current-template recurrence](../eval/experiments/2026-09-28-scene-pronoun-after-terms-results.md), [7B recurrence](../eval/experiments/2026-09-29-context-7b-p01-screen-results.md), [four-scene 1.8B/7B controls](../eval/experiments/2026-09-29-pronoun-cross-model-results.md) and [typed retry regression](../eval/experiments/2026-09-28-typed-provider-retry.md) retain raw prompt-copy, actor-number and retry failures with related/negative controls; generative/metamorphic and broader coverage remain open under [policy](evaluation/008-regression-and-adversarial-checks.md) |
| LONG-01 | Token-budgeted scene and batch planner | planned | CTX-02, CTX-03 | [Partial real 2,048-token preflight](../eval/experiments/2026-09-28-scene-context-results.md) and [owned 1,024/4,096/10,000-target planner checks](../eval/experiments/2026-09-28-long-scene-planner.md): chat template counts equal server usage, deterministic farthest-context trim and scene-limited mapping tested; target/batch sizing, real long-file token counts and quality remain open |
| LONG-02 | Batch and seam-shift ablation | planned | LONG-01, CTX-04, EVAL-02 | Batches 1/4/8, shifts 0/1/3 on retained scenes; paired seam/interior review |
| LONG-03 | Engineering soak ladder | planned | LONG-01, EVAL-02 | 1024/4096/10000-cue owned fixtures; resources, no duplicates, exact supported structure |
| LONG-04 | Complete natural-file quality pilot | planned | DATA-03, LONG-02, EVAL-01 | Three distinct sources, duration-tier gaps explicit; stratified and risk/boundary review |
| LONG-05 | Extended interruption and rejection matrix | planned | LONG-03 | Runtime/CLI/pause/disk/OOM/mismatch probes; durable prefix, edits, no partial result |
| LONG-06 | Stage timing, resource lease and SLA | planned | LONG-03, LONG-04, LONG-05 | Measured startup/decode/commit/export; declared resource limits and cancellation release |
| DECIDE-01 | Choose translation candidate and training need | planned | CTX-04, LONG-04, LONG-06 | Source-aware decision; target error families, quality/speed budget, baseline rollback |
| TUNE-01 | Fine-tuning data and compute feasibility | deferred | DECIDE-01, DATA-01 | Conditional: licensed independent training split, pinned recipe, memory/cost pilot |
| TUNE-02 | LoRA/QLoRA development pilot | deferred | TUNE-01, EVAL-02 | Conditional: reviewed domain examples, general controls, adapter identities and learning curves |
| TUNE-03 | Merge, convert and deployment-format comparison | deferred | TUNE-02, LONG-04 | Conditional: checkpoint/adapter/merged/GGUF evidence, quantization loss and rollback |
| PRECISION-01 | Isolated higher-precision comparison | deferred | DECIDE-01, EVAL-02 | Conditional on resource headroom/error hypothesis; same model/data/policy, actual quantization tradeoff |
| HOST-01 | Close historical-branch publication interruptions | planned | BASE-01 | Journal-only and staged publication termination, startup recovery, preserved explicit selection |
| HOST-02 | Clean distribution and selected backend package | planned | DECIDE-01 | Versioned installer/runtime/assets, archive-limit resolution if CUDA selected, real clean/offline install |
| HOST-03 | Final native review and candidate selection UI | deferred | DECIDE-01, HOST-01, HOST-02 | Owner-deferred UI milestone; actual model identity/review/attach/pause/restart through both databases |
| HOST-04 | Verify upgrade, compatible rollback and old results | planned | HOST-02, BASE-01 | Owned DB/package copies; interrupted migration/install, edits/history, identity refusal, backup restore and offline export |
| RELEASE-01 | Frozen Chinese holdout and term gates | planned | DECIDE-01, DATA-04, DATA-05, EVAL-02 | Blind G3/G4/G5; profile choice includes explicit accepted or rejected adaptation decision |
| RELEASE-02 | Translation reliability and export gates | planned | LONG-05, LONG-06, HOST-01 | G1/G2/G6/G7/G8 evidence for the exact release profile and supported format |
| RELEASE-03 | Clean Windows and desktop release gate | deferred | HOST-02, HOST-03 | G9 unseeded/offline and final native workflow, no mock substitute |
| RELEASE-04 | Chinese translation release candidate | planned | RELEASE-05 | G1–G9 decision record, notices, hashes, rollback and explicit exclusions |
| RELEASE-05 | Audit committed final candidate and regression dossier | planned | RELEASE-01, RELEASE-02, RELEASE-03, EVAL-04, HOST-04 | Gate/artifact/identity agreement, exact-target checks, publication and reviewed severity dispositions; [acceptance](RELEASE_ACCEPTANCE.md) |
| VOICE-01 | Reviewed spoken-script handoff contract | in_progress | CTX-01, EVAL-01 | Auralis local `feat/real-tts-pilot` commits `bc71330`, `13c9df7` and `770760a` bind selected verified result, cue/timing/speaker/voice and separate adaptation review fields with [opaque verified lineage](../eval/experiments/2026-09-28-voice-handoff-immutability.md) and a [two-database revalidation guard](../eval/experiments/2026-09-29-voice-selection-reverify.md); real reviewer identity/evidence, managed persistence, worker wiring and atomic selection at audio publication remain open |
| VOICE-02 | Real Russian TTS selection and adapter | planned | VOICE-01, LONG-06 | Auralis-owned real audio, resource lease, engine/voice identity and cancellation; exploratory Windows SAPI adapter and failed two-cue fit at Auralis `2812bc2`, [synthetic media and FFplay process check](../eval/experiments/2026-09-29-sapi-synthetic-media.md) at local `a468801`, and [real one-boundary cancellation cleanup](../eval/experiments/2026-09-29-sapi-cancellation.md) at local `5c6e38c` do not satisfy dependencies or A2/A3 |
| VOICE-03 | Duration fit, mixing and mux policy | planned | VOICE-02 | Measured fit tolerance, playable mapped segments, preserved meaning and separate artifacts |
| VOICE-04 | Human-listened three-scene dubbing pilot | planned | VOICE-03, RELEASE-01, VOICE-07 | Reviewed translation input, 10–20-minute scenes, proposed audio gates and reviewer evidence |
| VOICE-05 | Full-length dubbing soak and recovery | planned | VOICE-04, LONG-04, RELEASE-02 | Real complete media, no missing/duplicate audio, resume and resource contention evidence |
| VOICE-06 | Dubbing pilot release decision | planned | VOICE-05, RELEASE-04 | Playback/listener results, media provenance and audio limits separate from translation gate |
| VOICE-07 | Maintain speech and pronunciation regression controls | planned | VOICE-01, EVAL-04 | Real names/amounts/homographs/scene-boundary audio, lineage, fit/clipping and listening controls |
| ASR-01 | Transcript creation/alignment without source subtitles | deferred | VOICE-01 | Separate Auralis real ASR contract and recognition/alignment evaluation; not needed for subtitle pilot |
| LANGUAGE-01 | Separate Japanese admission and release evidence | deferred | RELEASE-04 | Japanese scenes, names, context, reviewers and independent G1–G9; no Chinese transfer claim |

## Current handoff

The next independently executable tasks are `CTX-02`, `DATA-03`, `DATA-04`,
`EVAL-04` and the unfinished `VOICE-01` handoff.
`PLAN-01` has passed planning-artifact and generated-progress checks; publication
is tracked separately in its acceptance record. `PLAN-03` freezes the user-started
Goal in its [scope record](../eval/experiments/2026-09-28-goal-scope-v1.md).
It does not claim implemented v5, training, a voice engine or any release gate. The earlier
`PLAN-02` planning audit remains a separate accepted scope.
`CTX-01` specifies v5, `DATA-01` supplies a checked source inventory, and
`EVAL-01` freezes the review protocol while recording unavailable human review;
`EVAL-02` checks future evidence shape, and `CTX-05` specifies bounded failure
while fixing one structural retry defect. `DATA-02` freezes 60 authored
development context contrasts; `CTX-02` can now implement the source-only v5
profile. Independent language review remains open.

The predeclared [v5 1,024-cue real-model recovery attempt](../eval/experiments/2026-09-29-long-v5-scene-failure.md)
adds partial `CTX-02`/`LONG-01`/`LONG-03` evidence and open `REG-003` under
`EVAL-04`: exact 16-block recovery reached 71/1,024 durable blocks, then the
1.8B model returned context ID 73 for target 72. The raw 269-request journal
and a neighbor-ID regression are retained. Zero result or partial output was
published. The full long-file, quality and resource gates remain incomplete;
the `planned` long-task statuses have not been promoted by this failed soak.

Deferred UI, optional adaptation/precision and ASR remain visible. A completed
translation CLI milestone does not close the desktop release or audio milestone.
Reclassify a deferred task only when its stated condition or owner scheduling
decision is satisfied. Record a blocked task's prerequisite and proposed next
action here or in its linked task record; waiting for a listed dependency is `planned`.
