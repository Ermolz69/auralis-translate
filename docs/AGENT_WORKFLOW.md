# Agent workflow for delivery, experiments and commits

Updated: 28 September 2026. Applies to the
[delivery plan](DELIVERY_PLAN.md) and [canonical backlog](IMPLEMENTATION_BACKLOG.md).
Repository [AGENTS.md](../AGENTS.md) and current user instructions remain binding.
Use the [release acceptance map](RELEASE_ACCEPTANCE.md) and
[regression policy 008](evaluation/008-regression-and-adversarial-checks.md) for
finite goal completion, change-triggered checks and retained bug reproductions.
The [goal objective](GOAL_PROMPT.md) is a template for a later execution request.

## 1. Start and select one bounded slice

Read AGENTS, the [documentation index](README.md), [product plan](PRODUCT_PLAN.md),
delivery plan, backlog, [status](IMPLEMENTATION_STATUS.md) and relevant architecture/
evaluation contract. Inspect `git status`, branch/remotes and existing diffs before
editing. Preserve unrelated work; never stage it just because it shares a directory.
For cross-repository work inspect Auralis instructions/state too.

Choose a `ready` task whose dependencies are done, or explicitly split/reprioritize
the backlog with a reason. Define observable acceptance and task commands before
implementation. Move the task to `in_progress`, record scope and report the next
uncertainty. Work may proceed on independent prerequisites while necessary missing
input is requested. No automatic new task/thread, delegation, cloud rental or
training run is implied by the roadmap.

Update the contract before changing agreed behavior. Version model/prompt/context/
terms contracts; keep previous checked profiles reproducible. Keep Translate's
core free of runtime, database, UI and media dependencies. ASR/TTS implementation
belongs to Auralis. Desktop UI remains deferred for the translator-only CLI
workstream; the separately authorized [desktop goal scope v3](../eval/experiments/2026-10-10-translate-desktop-goal-scope-v3.md)
permits its defined integration work.

## 2. Implement and verify the actual claim

Add a Taskfile task before introducing a new project check or experiment command.
Prefer small modules with typed inputs and explicit identity/error boundaries.
Behavior tests go under each crate's `tests/`; model-specific settings belong in
versioned manifests. Test source/target mapping, context isolation, fact protection,
identity mismatch and durability, not merely a copy of the implementation.

Use the lowest sufficient verification tier, then the required real gate:

| Tier | Purpose | Existing commands to select by scope |
| --- | --- | --- |
| Documentation/planning | Links, backlog consistency and report identity | `task docs:check`, `task plan:check`, `task site:build`, `task site:check` |
| Adapter/profile | Protected facts, prompt versions and package identity | `task test:fidelity`, `task test:model-profiles` |
| Process/durable state | Admission, cancellation, progress, edits and packages | `task test:preparation`, `task test:admission`, `task test:request-cancellation`, `task test:cli:protocol`, `task test:cli:packages`, `task test:result-edits` |
| Real short baseline | Checked models and frozen regression controls | `task eval:models:compare`, `task eval:public-demo:fidelity`, `task eval:currency-controls` |
| Existing long recovery | Synthetic full-file persistence and interruption | `task eval:load:checks`, `task eval:cli:long:interruption` |
| Release engineering | Rust and native integration as affected | `task fmt`, `task lint`, `task test`; select Auralis tasks in its own Taskfile |

Existing recovery/profile harnesses may require extension for v5/7B; do not assume
a task name implies support for every manifest. Context comparison, natural-long
quality, training and audio task commands are **planned, not executable yet**.
Create them in the implementing slice and document invocation, bounded budget and
prerequisites. Real hardware claims require the actual selected profile/runtime.
Mocks verify contracts; they do not pass semantic, installation or audio gates.
After required checks pass, repeat only for new changes or unresolved failures.

## 3. Predeclare every experiment

Before running, write a short experiment specification with a question, task IDs,
corpus/split hashes, model/profile/runtime identity, context/terms policy, baseline,
one changed factor where possible, run order, seeds/decoding, repetitions, maximum
requests/tokens/wall time, resource prerequisites and stop criteria. Defaults:
three fresh short-file runs per retained configuration; one exploratory long soak,
then repeated shortlisted soaks for variability. Screen variants before expanding
the matrix. Record all attempted variants, including timeout/OOM and rejection.

Keep training/dev/holdout separated by source group. Never feed reference text to
the model, tune on a sealed gate, claim independence for duplicates or patch the
benchmark with per-sentence substitutions. A fix needs unseen related cases and
negative controls. A changed profile gets a new experiment identity; old evidence
is immutable. Don't run ASR/TTS and translation concurrently without a measured
lease/resource policy. Don't silently switch model, CPU/GPU or cloud backend.

## 4. Evidence record and measurements

Store a machine-readable report plus an English experiment record under
`eval/reports/` and `eval/experiments/` for publishable, bounded evidence. Large
weights, raw licensed media and private reviewer sheets stay in controlled storage;
commit hashes/manifests and permitted extracts. An unknown field is `null` with a
reason, never an invented number. Public data must pass rights/privacy checks.

Required report fields:

- UTC start/end and local offset, git commit, dirty state and changed-code hashes
  when running uncommitted code; command, working-tree/task identities and exit.
- Model/checkpoint/GGUF SHA, immutable revision, quantization, profile/prompt/template
  hashes, tokenizer, runtime build/backend, context limit, actual offload details
  when observable, threads/slots/cache settings and hardware/OS/RAM/VRAM.
- Dataset/reference/split hashes, source provenance, cue/slot/scene IDs, context
  selection and batch/seam position, approved-term identity and reviewer type.
- Every attempted request: rendered input or secure hashed retained input, raw
  output, restored candidate, validation outcome, accepted persisted result,
  retries, errors, usage/cached tokens and request/stage durations when available.
- Original/result hashes and source-preservation checks, checkpoint prefix and
  completion counts, offline re-export, stop/resume state and publication outcome.
- Process CPU/RAM and sampled device VRAM with units, interval, observer overhead
  and failures; total device memory is not model-exclusive memory.
- Review rubric/coverage, source-aware error categories/severity, applicable term
  denominator, reference provenance, blind mapping and adjudicated decisions.

Use a monotonic clock for durations and wall clock for timestamps. Report count,
sum/median and defined p50/p95 (for example nearest rank, sorted value at
`ceil(p*N)-1`), retaining unrounded raw values. Do not use a three-sample p95 as
an accurate tail estimate; disclose N. Separate cold process and warm runs and
record unknown OS cache effects. Do not label residual file time as a measured
database or hashing stage. Sampled memory peaks are approximate lower bounds.

Language scores require declared reference and assessor provenance and a frozen
denominator. Under the current [published-reference protocol v2](evaluation/011-published-reference-review-v2.md),
AI assessments remain labelled AI, model-visible when applicable; they are not
independent human ratings. Report paired differences
and all regressions, not only wins. Automated similarity cannot prove source facts.
Google comparisons record actual observation date/input/output and opaque service
configuration; never fabricate a Google output or use browser wall time as a
matched local inference benchmark.

## 5. Presentation and public progress

The public report has two generated HTML files. `site/index.html` shows only the
current decision, verified capabilities, open gates, workflow and next actions.
`site/history.html` preserves earlier experiments, failures, detailed comparisons
and raw downloads. The owner requested this split on 2 October 2026 because the
single growing report obscured the present state. Both pages use remote Tailwind;
keep deployment dependency-free apart from that browser CDN. Build from frozen
evidence and the canonical backlog, not manually copied progress. Label measured,
proposed, AI-reviewed and human-reviewed claims and link the pages both ways.
Preserve all earlier evidence and failure records in the historical page.

Context views show source scene, declared target, actual supplied context, proposed
reference/provenance, model outputs and fact/meaning issues. Long-file views include
beginning/middle/end and seam samples, source duration/counts, coverage, timings,
resource charts and interruption outcomes. Audio views link permitted real playable
artifacts with script lineage and listening/fit results; mock files must be labelled.
Do not render thousands of cues eagerly if it makes the report unusable: paginate
or filter with downloadable complete allowed evidence. Escape source/model text.

Task counts must say task progress, never percentage of production quality. Ready,
planned, deferred and blocked remain visible. Planned experiment sizes are not
measured runs. Every new completed row links its scoped evidence. Verify site/data
checks, inspect the browser at desktop/mobile widths, publish and confirm the Pages
workflow and live artifact. A local build is not proof of remote deployment.

## 6. Git authorship, commits and publication

**Both author and committer must use the computer's main Git identity.** Read it
from `git config --global --get user.name` and `git config --global --get user.email`
on the current computer. Check origin/overrides and `git var GIT_AUTHOR_IDENT` /
`git var GIT_COMMITTER_IDENT` before committing. The owner's global identity has
been verified on this machine for this plan. Do not invent an agent/bot identity,
use a noreply replacement, add AI co-authorship or rewrite global configuration.
If the primary global email is absent or ambiguous, resolve that missing fact
before making a commit. Never amend somebody else's history to change authorship.

When local config or environment overrides interfere, use the verified primary
name/email in all four `GIT_AUTHOR_*` / `GIT_COMMITTER_*` identity variables for the
single commit process and restore the previous environment in `finally`. Example
PowerShell procedure (perform the staged review before executing):

```powershell
$primaryGitName = git config --global --get user.name
$primaryGitEmail = git config --global --get user.email
if (!$primaryGitName -or !$primaryGitEmail) { throw 'Main Git identity is missing' }
$identityValues = @{
  GIT_AUTHOR_NAME = $primaryGitName; GIT_AUTHOR_EMAIL = $primaryGitEmail
  GIT_COMMITTER_NAME = $primaryGitName; GIT_COMMITTER_EMAIL = $primaryGitEmail
}
$savedIdentity = @{}
try {
  foreach ($key in $identityValues.Keys) {
    $savedIdentity[$key] = [Environment]::GetEnvironmentVariable($key, 'Process')
    [Environment]::SetEnvironmentVariable($key, $identityValues[$key], 'Process')
  }
  git var GIT_AUTHOR_IDENT
  git var GIT_COMMITTER_IDENT
  git commit -F .cache/commit-message.txt
  if ($LASTEXITCODE -ne 0) { throw 'Commit failed' }
} finally {
  foreach ($key in $savedIdentity.Keys) {
    [Environment]::SetEnvironmentVariable($key, $savedIdentity[$key], 'Process')
  }
}
git log -1 --format='%h %an <%ae> / %cn <%ce>'
```

Keep identity checks in terminal evidence; the public benchmark page does not
need the owner's email. This is user-authorized attribution to the machine's
primary account, not a request to change account settings.

Use a simple `<type>/short-description` branch; default `feat/` for new features,
`docs/` for documentation, other allowed types as appropriate. Continue an existing
authorized branch when suitable. Make small coherent commits with explicit paths.
Review `git diff --cached`, including deletions, before commit. Never stage unrelated
changes, caches, weights, secret configuration or privately licensed corpora.

English commit format: `type(scope): short summary`. Allowed types are feat, fix,
refactor, test, docs, chore, ci, build, perf. Without an issue, **a body is required**
and explains what changed, why and preserved behavior. With an issue, add only
`(#number)` in the subject; a body is optional. Do not put Closes/Fixes/Refs or
other issue keywords in commits. Example without an issue:

```text
feat(runtime): add bounded scene context

- compose source context with approved terms and fidelity in prompt v5
- preserve legacy profiles and original cue mapping
- record matched context experiments before selecting a default
```

Keep backlog state, relevant contracts, implementation and evidence in the same
reviewable change where practical. Do not insert a guessed future commit SHA into
evidence; use the tested parent plus dirty hashes, then record publication identity
in the deployment/commit history. A `done` acceptance record may have a truthful
publication-pending line until the remote workflow is actually confirmed.

Push authorized changes only after checks and staged review. The existing owner
request authorizes this Translate repository/Pages publication. For future changes
to another external destination resolve its scope, not this already authorized one.
In a two-repository change, push Translate first, then update Auralis's pinned
submodule in a separate tested commit under the same primary identity. Never include
unrelated Auralis changes. Do not change the desktop pin merely for a documentation
publication. If making a PR, retain GitHub's default technical title and follow the
repository/session PR template; attach the created PR to the task.

## 7. Close a slice and hand it over

Update the task to `done` only when its scoped acceptance passes. Update next
dependencies to `ready`, keep open exclusions explicit, link evidence and regenerate
public progress where applicable. A deferred or blocked gate remains open even if
all implementation checks pass. Do not report speculative progress percentages.

The handoff states what changed and why, exact `task ...` checks and their observed
outcomes, experiment/review scope, limitations, commit/push/deployment evidence
and next ready task. Keep failures visible, including automatic approval rejection
if any operation remains blocked. Release status requires the full selected gate
record; a task completion is not a language or audio release.

## 8. Sustained goal execution and final audit

Freeze `PLAN-03` before a long execution. Track required IDs, optional conditional
branches, resources and external prerequisites, preserving the existing UI deferral.
Do not activate a Goal merely because a prompt template or plan is requested.
When execution is explicitly requested, create/continue it according to the
available Goal tool contract; do not invent a token budget. Backlog task `blocked`
and goal-level status have different rules. A limit is not completion.

Each iteration implements a bounded task, checks its acceptance and promotes a
ready dependency; it does not merely rewrite the plan or repeat the same failed
probe. New failures get a source/contract-based reproduction and related unseen
controls. Predeclare retry limits and failure categories; never regenerate without
bound until a chosen reference matches. Retain raw rejected candidates and no
partial publication. Stop an experiment on its declared resource/time criteria,
record it and revise the hypothesis before another budgeted comparison.

For `HOST-04` use owned copies, verify restore/identity and protect user databases.
For `DATA-05` preserve sealed splits and honest reference/assessment coverage. For `VOICE-07`
use real audio and listening rather than mock paths. At `RELEASE-05` verify one
committed candidate's gate, artifact, identity and public-report agreement. Apply
the gate map to the selected endpoint and repeat affected checks after final fixes.
Required deferred work or missing source-grounded quality evidence prevents full completion;
finish independent tasks and report concrete missing input instead of inventing a
pass. Scope exclusions must be explicit, and future directions remain in the backlog.
