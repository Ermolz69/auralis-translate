# Maintenance agent contract

## Objective and boundaries

Improve the assigned documentation or internal organization while preserving
observable behavior. Read repository `AGENTS.md`, the documentation index,
product/delivery/backlog/workflow contracts and relevant architecture before edits.
Read the assignment and current Git state. This contract does not launch other
agents, activate a Goal or authorize unrelated feature work.

Only Auralis and Auralis Translate may change. Other project repositories and
original MCE-2 directories remain untouched. Use synthetic fixtures and isolated
temporary application data. Do not open personal databases for writes, download
weights, run models or launch a native app as part of a model-free check.

Preserve APIs, command names, serialized fields, error codes and messages, format
acceptance, prompt/model/profile bytes, retries, timeouts, default settings,
database schemas, SQL ordering, durability and process/resource ownership.
For the UI preserve text, interaction, focus, accessibility and IPC call behavior.
If a probable bug appears, retain its reproduction and report a separate proposed
fix; do not fold a functional correction into a mechanical refactor.

Prefer explicit private functions and existing ports. Use a pattern only where
it clarifies an existing responsibility. Do not add a strategy registry, generic
workflow engine, dependency injection framework or new public trait for one caller.
Do not make private APIs public just to write tests.

## Workspace and ownership

Use the unique branch in the assignment in an isolated managed worktree. The
coordinator supplies a recorded base containing the planning files and registers
selected maintenance IDs in the canonical backlog. Check `git status`, HEAD,
remotes and diffs before editing. Preserve unrelated changes. If the branch already
exists, inspect and continue its authorized work; do not reset or reuse another
agent's branch. Do not change a shared checkout's branch underneath another agent.

Stay within assigned paths. Request coordination for shared files rather than
editing them concurrently. In particular, one task owner controls Taskfiles,
one documentation owner reconciles current docs, and the final Auralis integration
agent alone changes the Translate gitlink. Never edit the nested Translate
checkout to bypass the independent Translate assignment.

## Small commits

Aim for 100–300 changed non-move lines per coherent commit. Split work before
exceeding 500 non-move lines or roughly 1,000 raw added/deleted lines. A moved
function still counts toward raw review size; extract it in a separate small step
when necessary. These are review budgets, not targets to fill. Do not combine a
large move, renaming, formatting and semantic edits. Keep every commit buildable
and suitable for reversal.

Record `git diff --stat`, ordinary `--numstat` and rename-aware `--numstat -M`.
Explain unavoidable generated-file churn separately. Do not manually split
generated output into inconsistent commits or count it as handwritten refactoring.

Use the machine's verified primary global Git identity for author and committer;
follow the scoped procedure in `docs/AGENT_WORKFLOW.md`. Do not change global
configuration, add bot identities or amend another agent's history. English
commit subjects use `type(scope): summary`; a body is required without an issue.
Example: `refactor(runtime): isolate token preflight` with a body explaining the
move, its purpose and preserved request behavior.

Review explicitly staged paths before each commit. After successful checks,
commit and push only this assignment's branch to the verified repository remote;
record an unavailable remote rather than inventing one. Never force-push, merge
main or publish a site implicitly. Use the required PR
template and default technical title if opening a requested PR, then attach it.

## Verification and completion

1. Record baseline checks before changing the owner module. Distinguish a code
   failure from missing dependencies, sandbox process restrictions or missing
   assets. Do not weaken checks to obtain a green baseline.
2. Write the responsibility split and a before/after behavior matrix. Capture
   existing public behavior with meaningful contract tests where coverage is
   missing. Avoid tests that mirror private helper implementation.
3. Make one mechanical extraction at a time and run focused checks. Add any new
   project check to the Taskfile through its assigned owner before using it.
4. Run the assignment's complete final checks. Run affected docs/plan/report
   checks too. Preserve old evidence; make a new acceptance record for this ID.
5. Commit, verify the committed tree, and state whether a later docs-only record
   changed any tested source. Provide commit and tree identities honestly rather
   than guessing the future hash inside a commit.

Passing mocks/compilation does not close model, language, audio, native lifecycle
or clean-install gates. Where a changed boundary needs asset-dependent evidence,
leave that acceptance item open and name the exact required run. A reviewer may
accept a narrow internal move without promoting a release candidate.

## Required report

Save an English report under `docs/maintenance/reports/<assignment-id>.md`:

- Assignment ID, repository, branch, base HEAD, candidate HEAD and source tree.
- Problem, final responsibility map and exact paths changed.
- Before/after behavior matrix, evidence/test names and intentional exclusions.
- Every commit: hash, purpose, ordinary and rename-aware line counts.
- Exact `task ...` commands, working directory, exit codes, outcomes, ignored
  checks and retained failure logs or reproducible failure details.
- Public API/protocol/config/schema/profile changes: explicitly state none or
  identify a scope violation that remains unresolved.
- Documentation claims checked against source; generated-artifact differences.
- Known limitations, environmental blockers and outstanding acceptance items.
- Push/PR status only if actually performed, plus the next integration action.

The receiving reviewer reads the full diff, compares behavior at the base and
candidate, reruns focused checks on the committed tree and checks negative/error
paths. A self-report or green compile alone is insufficient. Return one of
`accepted`, `changes_requested` or `blocked_by_environment` per assignment;
describe any narrower accepted scope. Do not mark canonical work done until its
scoped acceptance record is linked and the reviewer has verified it.
