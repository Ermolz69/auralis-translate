# NAME-02 publication handoff

Date: 3 October 2026. Local commit/report audit; remote deployment unclaimed.

The [result](2026-10-03-name-action-admission-v1-result.md) closes only safety
containment. Baseline v8 remains selected for new usable runs; no new language
quality, natural full-file, human-review or release gate is passed.

Owned checkout: `.cache/name-action-publication`, branch `feat/name-action-review`,
parent `9173efd`. Core registry prerequisite commit `26aae72`; provider/CLI barrier
and deterministic tests commit `6c2e265`. The evidence/report commit follows this
record; its actual identity is available in Git history rather than a guessed SHA.
Both author and committer were checked against the primary global name/email and
scoped through four identity variables, then restored. No global config changed.

The final code matches all 383 frozen non-cache identities other than Taskfile:
61 byte-exact and 322 with checkout line endings only, zero content differences.
The publication Taskfile keeps the published REG-061 audit commands and adds the
same 88 NAME-01/02 task lines; its differences from the dirty tested Taskfile are
existing published checks, not a changed candidate, prompt, model or screen.
Frozen executables were preserved; no new inference or repeated screen was run.

Observed checks on the tested source:

- `task test:name-action`: six passes, zero failures.
- `task name-registry:check`: `task fmt`, `task lint`, `task test`; 281 passes,
  zero failures, three existing private ASUS checks ignored. Final log SHA-256:
  `9334b63d385ad8ffdfa9171b917dcafe3b37a448bb56233cf0d0c2e93a0c41d6`.
- `task eval:name-action:trace`, `task name-action:prepare`,
  `task eval:name-action:freeze`, `task eval:name-action:preflight`,
  `task eval:name-action:probe`, `task eval:name-action:catalog`,
  `task eval:name-action:check`: one offline screen retained and verified.

Observed checks in the owned candidate checkout:

- `task fmt`, `task eval:name-action:check`, `task eval:name-registry:check` passed.
  The preserved NAME-01 record remains 84 chats, 168 preflights, 84 checkpoints
  and six review-needed results; the NAME-02 screen still has zero new chats.
- `task plan:check`: 52 stable tasks, acyclic prerequisites, linked acceptance.
- `task docs:check`: 421 Markdown files with valid local file links.
- `task site:build`, `task site:check`: generated both pages and verified evidence,
  human counts, open quality gates and preserved historical observations.
- Local browser inspected at 1280×800 and 390×844: NAME-02 text readable,
  zero horizontal page overflow; temporary viewport reset. Browser checks used
  the source checkout's equivalent generated section, not remote deployment.

The first candidate-checkout trace failed because the owned cache had not yet
been copied; copying the exact authored frozen evidence fixed it without code,
request or response changes. Failed test/freeze/trace logs remain retained and
do not count as accepted runs. No model retry or approval-review rejection occurred.

Commits are local. No remote push, Pages workflow or live deployment is claimed.
The original checkout and its unrelated `014` edits remain intact. NAME-01 source,
accepted results, registry revisions, raw responses, v42 and baseline manifests
remain byte-preserved. Rollback is a fresh unchanged-v8 run; retain compatible
database backups and old-result profiles, never downgrade a user's v10 database.
