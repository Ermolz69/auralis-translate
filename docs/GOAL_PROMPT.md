# Reusable delivery goal prompt

Updated: 28 September 2026. This is an execution objective for a later user-started
Goal. Creating this document does not start that Goal or any implementation task.
Use [release acceptance](RELEASE_ACCEPTANCE.md) to distinguish a finite milestone
from the complete release target. Token budgets are set only if the user specifies one.

## Objective to submit

Complete the current Auralis Translate delivery scope: contextual Chinese-to-Russian
translation of long supported subtitle files, verified Windows delivery and a real
source-subtitle dubbing pilot in Auralis. Improve the implementation and regression
checks where evidence exposes defects. Execute the plan rather than stopping at
analysis, documentation or a mock demonstration.

Read AGENTS.md, docs/README.md, docs/PRODUCT_PLAN.md, docs/DELIVERY_PLAN.md,
docs/IMPLEMENTATION_BACKLOG.md, docs/AGENT_WORKFLOW.md,
docs/RELEASE_ACCEPTANCE.md, docs/evaluation/008-regression-and-adversarial-checks.md
and relevant architecture/status/experiment records. Inspect the actual checkout,
existing diffs, model/runtime identities and available hardware before changing code.
Preserve unrelated changes and all original media/subtitles and accepted results.

Create or continue the explicitly requested Goal as appropriate. Freeze PLAN-03's
finite scope, required task IDs, acceptance gates, optional directions, resources
and external prerequisites before long execution. The backlog is authoritative;
historical plans explain decisions but are not competing queues. Keep Chinese
translation G1–G9 and real audio A1–A6 separate. Japanese and ASR without subtitles
are later scopes; fine-tuning/precision are conditional decisions. Desktop UI
remains deferred until the owner's explicit scheduling decision, and a CLI-only
milestone cannot be reported as the full desktop/audio goal.

Implement bounded ready slices in dependency order. Update contracts before code,
preserve v1–v4 behavior and create the composable v5 source-context/terms/fidelity
policy. Build admitted development and sealed holdout data, paired context controls,
scene/token batching, seam-shift experiments, natural long-file quality audits,
synthetic load/fault probes and source-aware review. Fix discovered defects with
minimal reproductions and unseen related controls; keep failures and older evidence.
Complete package, migration/rollback, native reliability and consumer export checks.
If measurements justify training, use a feasible pinned adapter recipe and separately
verify the deployment-format result; otherwise record why the baseline is sufficient.
Build real TTS/audio work in Auralis with reviewed lineage, duration fit, listening,
full-length recovery and playback evidence. Do not conflate model translation with
voice synthesis or treat mocks as audio/quality evidence.

Use Taskfile commands; add tasks before new checks/probes. Predeclare each experiment's
identities, split, one-factor comparison, repetitions, resource/request/time budget
and stop criteria. Use actual model outputs and timings; report raw/restored/accepted
results, tokens, resource samples, errors and reviewer provenance. Never insert the
reference into prompts, tune on sealed holdout, fabricate Google/human review or
infer exact uninstrumented timings. Retries are bounded and explicit, and an invalid
or incomplete result is not published. Human reviewers, listening and clean-target
verification remain real prerequisites. Request necessary missing input while
continuing independent work; do not send messages to others without authorization
or start paid compute outside an approved budget.

Make small English commits with the required body and task/evidence context, using
the computer's verified primary global Git name/email for both author and committer.
Detect local/environment overrides; never use an agent identity or change global
configuration. Review staged paths and preserve unrelated work. Push verified
Translate changes and regenerate/publish the single Tailwind-CDN HTML report on
the already authorized repository/Pages. For actual two-repository implementation,
inspect Auralis instructions/state and follow the tested submodule/push order.
Do not update its pin just for planning documents.

Update task states/evidence after every verified slice; distinguish planned, measured,
human-reviewed and AI-reviewed evidence. Re-run affected checks after corrections,
retain regressions and improve test coverage based on concrete risks. Keep public
progress generated from the canonical backlog, public data rights/privacy checked,
and deployment verified on the live page. Avoid expanding an already sufficient
goal into unlimited new features.

Complete RELEASE-05's final audit from the committed candidate checkout. The full
Goal is complete only when all required scoped tasks and G1–G9/A1–A6 pass, actual
artifacts and independent reviewer coverage match the frozen identities, and
published evidence/CI/Pages agree with the release decision. Optional exclusions
need explicit reasons; required deferred/blocked work remains incomplete. A resource
limit or missing real check does not satisfy completion. Follow the available Goal
tool rules for status changes, preserve a resumable handoff for genuine external
blocks, and report exact remaining input rather than inventing success.

Final handoff: scope and gate decisions, changed behavior, exact task checks and
observed results, model/quantization/context decision, context/seam/full-file/audio
review coverage, benchmark and artifact links, commits/deployment, rollback and
any unsupported combination or remaining blocker. Never claim training, human
approval, clean installation or playable dubbing from compilation alone.
