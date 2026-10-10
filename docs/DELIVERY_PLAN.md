# Delivery plan: contextual translation and dubbing

Updated: 28 September 2026. This is the authoritative delivery sequence. The
[tracked backlog](IMPLEMENTATION_BACKLOG.md) owns task status;
[agent workflow](AGENT_WORKFLOW.md) owns execution, evidence and commit rules.
The [release acceptance map](RELEASE_ACCEPTANCE.md) binds finite goal scope and
gate evidence; [regression policy 008](evaluation/008-regression-and-adversarial-checks.md)
maintains future checks. A [reusable goal objective](GOAL_PROMPT.md) is available
for a later execution request, without starting implementation now.
The [product plan](PRODUCT_PLAN.md) still owns file invariants and G1–G9.
The former [S0–S9 stages](IMPLEMENTATION_STAGES.md) remain acceptance references,
not a second task queue. This plan supersedes the next-step ordering in
[quality plan 007](evaluation/007-translation-quality-improvement-plan.md).

## 1. Finish two separately verifiable products

**Translation release:** a long Chinese subtitle file produces a separate Russian
file with stable meaning across scenes, recoverable progress and preserved
supported source structure. A validated file can still require language review.
Never treat structural validity as approval for unattended dubbing.

**Dubbing pilot:** Auralis takes an explicitly selected, reviewed translation,
creates a versioned spoken script, synthesizes real speech, fits it to the chosen
timing policy and exports a playable audio/video result. Translate owns language,
source mapping, runs and immutable results. Auralis owns media, host jobs,
speakers, ASR/TTS, mixing and artifact publication. A translation LLM does not
itself supply an audio engine. End-to-end audio needs separate evidence.

The immediate implementation sequence is CLI first. Desktop model selection and
review UI are deferred as requested; planning their final acceptance is allowed.
Chinese is the first language gate. Japanese and broader subtitle syntax stay
separate. Existing source files remain immutable for the project lifetime.

## 2. Baseline and honest progress

| Capability | Evidence on 28 September | Open boundary |
| --- | --- | --- |
| Strict plain-SRT/WebVTT, checkpoints, edits, host publication | [Implementation status](IMPLEMENTATION_STATUS.md) and linked real/native probes | S7/S8/S9 still contain open gates; unsupported syntax is rejected |
| Money fidelity | [v4 currency experiment](../eval/experiments/2026-09-27-chinese-currency-protection.md) | Bounded admission; not a universal money parser or general quality guarantee |
| Model choice | [240 requests, matched 1.8B/7B profiles](../eval/experiments/2026-09-27-model-size-comparison.md) | Forty authored development entries; visible-model AI editorial review, no blind human accuracy claim |
| Long-file recovery | [Synthetic 1,024-cue protocol](evaluation/005-long-file-recovery.md) | Repeated short phrases exercise persistence, not sustained narrative understanding |
| Context and terminology | Existing prompt v2 and v3 contracts | v4 fidelity does not compose both; no validated combined context profile |
| Audio delivery | [Auralis architecture](https://github.com/Ermolz69/auralis/blob/main/docs/architecture/001-overview.md) describes the target | Existing mock dubbing is not production ASR/TTS/mux evidence |

The measured 7B demo median file time is 34.764 s versus 10.231 s for 1.8B
(about 3.40 times). Peak total GPU usage in the control comparison reaches
7,631 MiB on the 8-GiB RTX 3070, including other applications. This justifies
testing resource budgets before enlarging context or overlapping speech engines.
The larger model repairs some idioms/negation and also introduces regressions.
Both models still misread giving change and the adopted Chinese name policy.

Backlog counts measure completed **tasks**, not percent of product quality or
release readiness. Every `done` task needs linked evidence and scope. No release
date or throughput promise is fixed before the long-file baseline. Record measured
work and estimates separately. The [public report](https://ermolz69.github.io/auralis-translate/)
shows the current decision and generated task progress, with all prior model
evidence on its separate historical page under the
[owner-requested layout v2](reference/public-report-layout-v2.md).

## 3. Data and source-matched assessment

Current translator execution follows [scope v3](../eval/experiments/2026-10-10-translation-only-scope-v3.md)
and [published-reference review v2](evaluation/011-published-reference-review-v2.md).
The reviewer procedure originally frozen below is historical context, not a
requirement to recruit anyone for the current work. Preserve old scores and
failures; do not relabel AI assessments as independent human review.

### Admission and splits

Create an inventory before collecting a larger corpus: source URL/revision/hash,
language, medium/series/episode, scene boundaries, cue IDs/timing, speaker evidence,
rights for use and redistribution, alignment procedure and reference author.
Audio rights and subtitle rights are separate fields. Unknown rights block
publication of that content. Publish permitted extracts and manifests; do not
embed unlicensed full episodes in Pages. Existing authored tests may be public.

Initial subtitle target: at least 500 eligible Chinese cues across 20–30 scenes,
approximately 200 development and 300 sealed holdout cues. Split by whole source
or related series group before creating windows. Adjacent scenes, paraphrases,
duplicate sentences and alternate releases must not cross splits. Keep training,
development and release holdout separately versioned. Record duplicate detection
and exclusions. These counts are initial collection targets, not obtained data.

Keep the existing 40-entry model set as a known regression suite. Its overlapping
price example is not an extra independent sentence. FLORES sentence evidence is
auxiliary and cannot substitute for a subtitle scene gate.

Use independently published professional Chinese/Russian versions of the same
work, preferably same-version subtitle tracks. Retain acceptable alternatives
and uncertainty grounded in Chinese source and scene evidence. Label all
AI assessments explicitly. A published reference is not a single compulsory
wording. Google is a dated machine baseline, not a gold reference, and its web
UI does not yield comparable local inference latency. Select media context only
when rights and task needs permit it.

### Review protocol

Blind candidate identities and randomize order for language evaluation. Evaluate
meaning (1–5), omissions/additions, negation, actors/direction, names, money/units,
register, grammar, terminology and cue placement. Record critical/major/minor
severity, source evidence, proposed correction and assessor IDs. Under protocol
v2, separately identified AI assessments and deterministic source checks retain
disagreement/uncertainty as failures; there is no compulsory human assessor.
Keep style preference separate from adequacy. Secondary automatic metrics may
aid triage but do not decide the release gate alone.

Assess all 300 eligible sealed cues for the initial gate, with per-category
denominators. Natural long-file audits use all known risk/boundary cues plus a
preselected stratified sample of at least 200 cues per file, or every cue if fewer;
publish the coverage. Sampled audits do not claim whole-file semantic correctness.
Once a holdout is inspected to tune a fix, retire it to regression and prepare a
new sealed release set. Store score sheets and candidate-to-model mapping separately
until assessment finishes. Store assessor/model identity with each result.

## 4. Context experiments and composable policy

Create 60 authored target-cue cases, 12 per category:

| Category | Required contrast |
| --- | --- |
| Pronouns, gender, address and speaker relationships | A preceding introduction changes a justified Russian pronoun or register |
| Split clauses, ellipsis and negation | A sentence spans cues; the next cue completes the target without moving text into another cue |
| Names and recurring terminology | Chinese names, approved transliteration, stable referents and a later callback |
| Money and factual relations | Yuan versus explicitly named foreign currency, giving change, payer/payee, amount and unit controls |
| Idioms, irony and ambiguity | Literal reading versus scene-supported intention, with genuinely underspecified controls |

For each target prepare isolated input, sufficient relevant context, an unrelated
context control, and a counterfactual scene variant. The last variant is a separate
source scenario with its own reference, not an instruction to override the target.
Include insufficient-context cases where preserving uncertainty is correct.
Never insert the reference translation into model input. Assertions cover expected
facts and prohibited additions; editorial grading covers acceptable phrasing.

Before code, specify an experimental **prompt v5** with composable source context,
approved terminology and fidelity. Keep v1–v4 byte/prompt behavior unchanged.
Identity must include manifest, prompt/template, context policy, terms and source
hashes. Context is read-only source evidence; only declared target slots may be
translated. Separate target/context delimiters, reject instruction-like output,
validate exact IDs and prevent omitted, duplicated or moved target slots. Do not
let a previous model-generated translation silently become authoritative context.

Money protection must preserve both exact facts and usable semantics in the prompt.
Masking an amount must not hide that it is a payment or change. Test restoration,
mixed currencies, adjacent identical numbers, nonmonetary pieces and malicious
token copying. Fix semantic errors through a general documented policy; do not
hardcode a preferred full sentence for each visible benchmark failure.

Start with one previous and one following source cue as a control, then two previous
and one following, bounded to the same scene and token budget. Compare:

1. Existing v4 single-target baseline.
2. v5 fidelity with context disabled (isolate policy migration).
3. v5 with source context only.
4. v5 with approved terminology only.
5. v5 with context and terminology.

Use both 1.8B and 7B for shortlisted configurations. First screen a small development
subset, then run all 60 context cases three times for retained candidates. Predeclare
the request budget; do not silently run the full Cartesian product of every window,
batch size, model and decoding variant. Measure paired improvements and regressions
against the same targets, including unrelated-context susceptibility. Freeze the
selected policy before the sealed evaluation. A larger context is not a quality result.

## 5. Scene planning, chunking and long files

Distinguish a **scene**, a **target batch**, a **read-only context window**, a
**durable checkpoint** and an **export page**. They need not have identical sizes.
A target cue occurs in exactly one accepted checkpoint; overlapping context never
becomes duplicate output. Prefer complete cue boundaries and source-supported
scene breaks. Multiple cues may form one translation batch only with validated
mapping back to the original slots. Never fabricate timing for unaligned text.

Use the actual model tokenizer and fully rendered template to count input tokens.
Reserve output capacity plus a documented safety margin; include source context,
terminology and fidelity metadata in the budget. Start at the already tested
2,048-token server limit. Evaluate 4,096 separately with real peak memory, OOM
behavior and headroom. Do not assume a 7B weight file fitting means a long context
fits. Deterministically reduce context/target batch under a versioned policy or
reject; never silently truncate target text. Plain text requires a separate
admitted document contract, and time alignment belongs to ASR/media work.

Confirmed scene terms/speaker metadata need their own provenance and hash.
Any later summary strategy must be evaluated for factual loss, versioned and
persisted, with dependent checkpoint invalidation. Start with source windows;
recursive model summaries are not the first baseline. Recompute only invalidated
work on an explicit new run/revision rather than mutating accepted checkpoints.

### Two long-file tracks

| Track | Planned ladder | What it can establish |
| --- | --- | --- |
| Engineering | Existing 1,024-cue fixture, then 4,096 and 10,000 cues, including varied nonrepeating authored text | Bounded memory, exact source mapping, durable resume, cancellation, no partial publication |
| Natural narrative quality | Licensed complete sources around 30, 90 and 180 minutes where available, with actual cue/slot counts reported | Scene continuity, long callbacks, recurring terms, end-of-file drift and boundary errors |

Do not extend a short scene by repeating it and label that a feature-length
quality test. Source durations and counts are measured, not forced to match a
label. Admit at least three distinct complete sources for the first long-quality
pilot; keep their development/holdout groups separate. If a duration tier cannot
be obtained legally, record the gap rather than fabricate evidence.

Test target batch sizes 1, 4 and 8 as initial variants, subject to token limits.
On selected scenes shift the chunk start by 0, 1 and 3 cues while preserving the
same source, context rules and target identities. Annotate seam versus interior
cues. Inspect first/middle/last sections, sentence continuations, delayed callbacks,
speaker changes, amounts and names. Report paired error counts and positional
coverage, including failures that occur only at seams. Add larger batches only
if the measured shortlist needs them.

For each full-file run record elapsed time from admission to validated publication,
tokens, attempted/accepted/rejected requests, retries, per-stage timings, CPU/RAM/
VRAM samples and resource release. Distinguish startup/hash/load, prompt evaluation,
decode, validation, checkpoint commit and export instrumentation. Uninstrumented
time is labelled overhead; never infer its exact cause by subtraction alone.
Report p50/p95 with sample count and quantile method, peak values and sampling
intervals; sampled peaks are lower bounds. Separate process RSS/private bytes from
whole-device GPU use. Capture actual GPU offload/backend details when available.

Start with one soak per configuration. Repeat shortlisted full-file candidates
when assessing variability, not every exploratory variant. Interleave or reverse
model order to expose warm-cache/startup effects. Publish first cold process and
warm runs separately; operating-system cache isolation may remain unknown.

### Recovery and rejection matrix

Extend the [existing interruption protocol](evaluation/005-long-file-recovery.md)
rather than creating an unrelated happy-path script. Cover CLI/runtime termination,
pause during hashing/inference/commit/export, application restart, disk-full
failure, malformed output, timeout, OOM, stale/competing attempts, changed model/
prompt/context identity and explicit offline re-export. Inject faults in owned
fixtures and scratch storage. Never damage user media or accepted results.

Compare original bytes/hash, accepted checkpoint prefix and payloads, edit ancestry,
result count, exported bytes and both database associations. A resume must preserve
accepted work without duplicating it. A changed identity must reject incompatible
resume. Failure must retain diagnostics and publish no partial result. Resources
must be released after cancellation. Existing historical-branch publication gaps
also stay in the backlog; a model quality improvement cannot close them.

## 6. Decide whether weights need training

First distinguish prompt/context/terminology improvements from weight fine-tuning.
Train only after the reviewed development errors show a persistent domain pattern
that the composed baseline cannot fix within the resource budget. Passing the
translation gates without training is a valid completion. Do not train from scratch.

The publisher supplies [Hy-MT2 training procedures](https://github.com/Tencent-Hunyuan/Hy-MT2/blob/main/train/README.md)
including dense-model LoRA and full fine-tuning. Its listed 7B LoRA recipe at
8,192 tokens uses an 80-GB-class GPU; that particular recipe is not an 8-GB promise.
[PEFT quantization](https://huggingface.co/docs/peft/developer_guides/quantization)
describes training additional adapters on quantized base weights. A shorter-context
QLoRA alternative needs a separate compatibility/memory pilot; the current RTX 3070
is not certified for training. Fix code/dependency revisions before execution.

Training input is the supported original training checkpoint/tokenizer plus an
adapter recipe, not in-place editing of the inference GGUF Q4 file. Proposed data
ladder: 1,000 carefully reviewed examples for a feasibility pilot, then 5,000–20,000
if diversity, learning curves and rights justify expansion. These are experiment
sizes, not guaranteed sufficient training. Include scene context and target-only
responses, hard negatives, ambiguous controls and general-language retention.
Do not use raw model outputs or Google translations as unquestioned human gold.

Record checkpoint/tokenizer/adapter hashes, data splits, recipe, seeds, optimizer,
rank, learning rate, sequence length, precision, environment and training wall time.
Evaluate baseline checkpoint, adapted checkpoint, merged checkpoint and converted/
requantized GGUF separately to isolate training gains and conversion loss. Preserve
the previous runnable profile for explicit rollback. Training compute/cost is a
separate resource decision; this planning task does not rent compute or start training.

Accept an adapter only when blinded development review improves the targeted errors,
critical and general-language controls do not regress, and the sealed gate and long
file budget pass on the actual deployment format. If not, retain baseline and record
the negative result. Further 1.8B Q8/7B Q6 precision experiments are conditional on
observed errors/headroom and isolate quantization from model size and prompt policy.

## 7. Prepare speech and verify actual dubbing

Define a versioned handoff containing selected translation result/revision/hash,
source cue IDs and timings, approved speaker IDs, language, scene/term policy,
spoken-script revision and job provenance. No implicit selection of an old or
unreviewed result. Store pronunciation/number expansion and meaning-preserving
spoken adaptation separately from the immutable subtitle result. Expanded yuan
and ruble amounts must retain the approved original facts. Speaker identity,
emotion and pronunciation need source or reviewed evidence, not invented metadata.

Choose and measure a real Russian TTS engine in Auralis; where no usable source
subtitles exist, separately admit a real ASR/alignment engine and its errors.
Existing subtitles allow the first dubbing pilot without ASR. Model lifecycle and
GPU leases must serialize or budget ASR, translation and TTS on this machine.
Automatic CPU/model/cloud fallback must never silently change the declared profile.

For each real synthesized segment record text/hash, engine/voice configuration,
audio hash, sample rate, duration, intended time interval and output placement.
Evaluate pronunciation of Chinese names, expanded numbers, stress, intelligibility,
speaker continuity, sentence rhythm, overlaps and scene transitions. Set the
permitted fit/trim/stretch policy before muxing and record every adjustment. If
speech does not fit, request reviewed shortening or mark the segment for review;
do not delete meaning or silently alter original subtitle timestamps.

Proposed pilot: at least three 10–20-minute scenes with differing speakers and
money/names/context risks. Human listeners assess meaning and intelligibility
with source-aware review where needed. Initial proposed audio acceptance: every
approved segment has playable mapped audio, no missing/duplicate segments,
no clipping under the documented PCM check, no unresolved critical meaning or
speaker errors, and at least 95% of eligible utterances rated 4/5 or better for
intelligibility/naturalness. Freeze reviewer definitions, fit tolerance and final
mix loudness limits after baseline measurement and before final validation.
These are proposed pilot gates, not claimed measurements or replacements for G1–G9.

Use listening and actual media playback, not just file existence or mock `.wav`
names. Keep translated subtitles, spoken script, segment audio and muxed output as
separate artifacts with lineage. Failed audio work must not corrupt translation
history. Full-length dubbing is a later soak after the scene pilot passes.

## 8. Release gates and sequence

| Milestone | Exit evidence | Next decision |
| --- | --- | --- |
| M0 Planning and inventory | Canonical backlog, workflow, rights/schema protocol and frozen baseline links | Admit context/dev sources |
| M1 Composed context | v5 contract, 60-case paired review, protected facts/slots and matched model comparison | Choose policy and candidate |
| M2 Long-file translation | Natural sources, seam ablation, soak, fault/resume matrix and measured SLA | Decide if fine-tuning/precision work is needed |
| M3 Optional adaptation | Reproducible adapter/conversion comparison, retained baseline, no sealed regressions | Accept or reject adapted weights |
| M4 Translation candidate | Independent holdout plus product G1–G9; selected Windows/backend/model package | Chinese translation RC |
| M5 Real dubbing | Reviewed handoff, real TTS scene pilot, listening, media fit and full-length soak | Dubbing pilot release, separate from translation RC |

G1 requires 100% supported structure preservation. G2 requires an explicit
outcome for every source slot. G3 requires at least 95% eligible holdout cues with
adequacy at least 4/5. G4 requires zero unresolved critical holdout errors. G5
requires at least 98% applicable approved-term matches, allowing documented Russian
inflection. G6 requires an SLA chosen from measured hardware evidence. G7 covers
checkpoint/edit recovery; G8 target-consumer export; G9 real clean-OS offline setup.
Use the [product definitions](PRODUCT_PLAN.md), not a looser report summary.

The current developer-machine CPU install is not G9. The existing externally
prepared CUDA runtime is not a distributable verified CUDA package. Packaging,
installer archive limits, native cancellation, journal/staged publication gaps
and final human-review flow must close on the selected release path. Desktop
changes wait for the deferred integration milestone; no new UI is requested now.

Do not require optional training when baseline passes, or call the audio pipeline
complete when only translation passes. Maintain a release decision record with
all applicable gates, exact frozen identities, open exclusions and rollback profile.
Other language, OS, backend and format combinations need their own admission.

## 9. First execution slice

Start `DATA-01` and `CTX-01` independently: define the provenance/schema and the
v5 context/terminology/fidelity contract. Then build the 60-case development suite
and prospective reference protocol before implementing/tuning the adapter. Keep
the existing 420-request public evidence unchanged. Every subsequent slice follows
the [agent workflow](AGENT_WORKFLOW.md), updates the backlog and publishes measured
comparison evidence only after the named checks pass.

## 10. Complete the goal and improve future checks

Before sustained execution, `PLAN-03` freezes required and optional task IDs,
hardware/format/endpoint scope and resources. The [acceptance map](RELEASE_ACCEPTANCE.md)
prevents a local CLI milestone from closing a broader desktop/audio objective.
Source-matched published references, legal natural sources, clean-target checks and owner-deferred
UI remain concrete external prerequisites; continue independent work while resolving
them. The current planning request does not activate a Goal or start training.

The audited additions are `DATA-05` for alignment/leakage/reference coverage,
`CTX-05` for typed bounded retries and review outcomes, `EVAL-04` for maintained
regression/adversarial/property/metamorphic checks, `HOST-04` for safe upgrade and
rollback, `VOICE-07` for real speech regressions and `RELEASE-05` for a final
committed-candidate audit. Their implementation is planned, not implied by these
documents. Follow [policy 008](evaluation/008-regression-and-adversarial-checks.md)
to retain minimal reproductions, unseen related controls and an immutable corpus
history. A score gain must not hide a new critical regression.

Keep every retry attempt and reject incomplete publication. Freeze limits before
measurement; do not tune retries, references, exclusions or gate thresholds merely
to make a candidate pass. Upgrade/rollback probes run only on owned database/package
copies, preserving edits, historical results and compatible backups. The final audit
ties raw evidence, profiles, selected consumer artifacts and public results to one
actual candidate and records an explicit rollback path.

Completion requires the scoped G1–G9 and audio A1–A6, not a green build or a done-task
percentage. Conditional training may be unnecessary; required blocked/deferred work
cannot be erased. Record excluded future directions with reasons, preserve unresolved
input as a resumable handoff and stop expanding features once the frozen objective
is met. The reusable [goal prompt](GOAL_PROMPT.md) carries these execution rules.
