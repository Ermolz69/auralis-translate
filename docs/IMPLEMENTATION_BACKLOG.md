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

## Task table

| ID | Work | Status | Depends on | Acceptance / evidence |
| --- | --- | --- | --- | --- |
| BASE-01 | Strict source/result and checkpoint foundation | done | - | Narrow implemented slices only; open S7–S9 retained in [status](IMPLEMENTATION_STATUS.md) |
| BASE-02 | Real synthetic long-file recovery baseline | done | BASE-01 | Existing bounded scope and [recovery evidence](../eval/experiments/2026-09-26-long-file-recovery.md) |
| BASE-03 | Matched 1.8B/7B development comparison | done | BASE-01 | 240 real requests, AI editorial review and [experiment](../eval/experiments/2026-09-27-model-size-comparison.md) |
| PLAN-01 | Delivery plan, canonical progress and agent rules | done | BASE-03 | Documents/generated task progress; plan/docs/site and browser DOM checks passed; [acceptance record](../eval/experiments/2026-09-28-delivery-plan.md) tracks publication |
| DATA-01 | Source rights, provenance, scene and split schema | ready | BASE-03 | Schema examples validate; rights/alignment exclusions and whole-source grouping documented |
| DATA-02 | Sixty context contrast cases | planned | DATA-01, CTX-01 | Five categories, four scenarios per target, references/prohibited facts and IDs frozen |
| DATA-03 | Licensed development subtitle scenes | planned | DATA-01 | Approximately 200 eligible cues; source/scene/speaker provenance and aligned references |
| DATA-04 | Sealed independent release holdout | planned | DATA-01, EVAL-01 | At least 300 eligible cues; independent groups/references, no tuning exposure |
| EVAL-01 | Blind review, scoring and adjudication protocol | ready | BASE-03 | Human/source-aware rubrics, critical taxonomy, denominators and reviewer availability |
| CTX-01 | Specify composable prompt v5 | ready | BASE-03 | Source windows, approved terms, fidelity, identity and strict output mapping contract |
| CTX-02 | Implement v5 without changing v1–v4 | planned | CTX-01, DATA-02 | Target/context separation; invalid IDs/tokens rejected; legacy profile checks pass |
| CTX-03 | Scene terms and speaker evidence | planned | DATA-03, CTX-01 | Explicit approved facts with scope/hash; no invented speaker or automatic summary authority |
| CTX-04 | Paired context/model ablation | planned | CTX-02, CTX-03, EVAL-01 | Budgeted repeated 60-case comparison, unrelated/insufficient-context controls and blinded review |
| EVAL-02 | General comparison and evidence schema | planned | CTX-01, EVAL-01 | Frozen identities, failures, timings/quantiles, raw/restored/accepted outputs and reproducibility |
| EVAL-03 | Context and long-file HTML presentation | planned | EVAL-02, CTX-04 | Same evidence identities; scene/target/seam views, review labels, counts, public rights and raw downloads |
| LONG-01 | Token-budgeted scene and batch planner | planned | CTX-02, CTX-03 | Actual rendered-token budgets; deterministic context trimming and complete cue mapping |
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
| RELEASE-01 | Frozen Chinese holdout and term gates | planned | DECIDE-01, DATA-04, EVAL-02 | Blind G3/G4/G5; profile choice includes explicit accepted or rejected adaptation decision |
| RELEASE-02 | Translation reliability and export gates | planned | LONG-05, LONG-06, HOST-01 | G1/G2/G6/G7/G8 evidence for the exact release profile and supported format |
| RELEASE-03 | Clean Windows and desktop release gate | deferred | HOST-02, HOST-03 | G9 unseeded/offline and final native workflow, no mock substitute |
| RELEASE-04 | Chinese translation release candidate | planned | RELEASE-01, RELEASE-02, RELEASE-03 | G1–G9 decision record, notices, hashes, rollback and explicit exclusions |
| VOICE-01 | Reviewed spoken-script handoff contract | planned | CTX-01, EVAL-01 | Result lineage, cue/timing/speaker mapping and separately reviewed number/name adaptation |
| VOICE-02 | Real Russian TTS selection and adapter | planned | VOICE-01, LONG-06 | Auralis-owned real audio, resource lease, engine/voice identity and cancellation |
| VOICE-03 | Duration fit, mixing and mux policy | planned | VOICE-02 | Measured fit tolerance, playable mapped segments, preserved meaning and separate artifacts |
| VOICE-04 | Human-listened three-scene dubbing pilot | planned | VOICE-03, RELEASE-01 | Reviewed translation input, 10–20-minute scenes, proposed audio gates and reviewer evidence |
| VOICE-05 | Full-length dubbing soak and recovery | planned | VOICE-04, LONG-04, RELEASE-02 | Real complete media, no missing/duplicate audio, resume and resource contention evidence |
| VOICE-06 | Dubbing pilot release decision | planned | VOICE-05, RELEASE-04 | Playback/listener results, media provenance and audio limits separate from translation gate |
| ASR-01 | Transcript creation/alignment without source subtitles | deferred | VOICE-01 | Separate Auralis real ASR contract and recognition/alignment evaluation; not needed for subtitle pilot |
| LANGUAGE-01 | Separate Japanese admission and release evidence | deferred | RELEASE-04 | Japanese scenes, names, context, reviewers and independent G1–G9; no Chinese transfer claim |

## Current handoff

The next independently executable tasks are `DATA-01`, `CTX-01` and `EVAL-01`.
`PLAN-01` has passed planning-artifact and generated-progress checks; publication
is tracked separately in its acceptance record. This request creates the plan, not v5, a trained adapter
or a voice engine. No implementation task is silently promoted to `in_progress`.

Deferred UI, optional adaptation/precision and ASR remain visible. A completed
translation CLI milestone does not close the desktop release or audio milestone.
Reclassify a deferred task only when its stated condition or owner scheduling
decision is satisfied. Record a blocked task's prerequisite and proposed next
action here or in its linked task record; waiting for a listed dependency is `planned`.
