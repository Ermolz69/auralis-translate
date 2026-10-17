# Translate task discovery assignment

Execute proposed ID `MNT-02` on `chore/translate-task-discovery`.
Read the [agent contract](../AGENT_CONTRACT.md). Own root `Taskfile.yml`, new
focused taskfiles, maintenance check scripts and your report. Coordinate command
documentation with MNT-01. Runtime and report assembly source belongs to other agents.

## Sequence

1. Inventory the current task catalog, aliases, command expansions, environment,
   required variables and working directories. Separate model-free checks from
   explicit network/model/native operations without changing any command.
2. Extract a small developer-check group and focused maintenance-check groups
   into included taskfiles or retain root forwarding entrypoints. Preserve all
   existing public task names and cross-task resolution. Do not migrate all
   4,298 lines or rewrite frozen historical experiments in one change.
3. Add focused wrappers needed by MNT-03 for provider protocol/profile/token/
   journal/cancellation tests; MNT-04 for CLI process/resume/export tests; and
   MNT-05 for report assembly/verification contracts. Reuse existing commands
   where complete. The future native/model checks remain explicit opt-in tasks.
4. Add a bounded catalog-equivalence check covering moved tasks, including
   variables, dependency resolution and root working directory. Register this
   check as a task before running it. Do not execute an experiment just to
   demonstrate that its catalog entry still exists.

## Acceptance

Every previous public command remains available with the same required variables,
effective commands and dependency ordering. `task fmt`, `task lint`, `task test`,
`task docs:check`, `task plan:check`, `task site:build` and `task site:check` retain
their meanings. No default task starts a model, fetches media or publishes a site.
New maintenance commands are documented and safe for synthetic/local fixtures.

Use Task's catalog/dry-run facilities for equivalence and run the new model-free
check wrappers, `task docs:check` and `task plan:check`. Document unavailable
prerequisites instead of adding installs. Split catalog extraction and new test
entrypoints into separate small commits. Report the exact command names supplied
to dependent agents and leave the remaining historical inventory unchanged.
