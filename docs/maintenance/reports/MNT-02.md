# MNT-02 — Translate task discovery and maintenance checks

Status: candidate for receiving review; no release gate is claimed.

| Identity | Value |
| --- | --- |
| Repository | `auralis-translate` |
| Branch | `chore/translate-task-discovery` |
| Recorded base HEAD | `4319177b7e41512a2aabfc5cd30f49357b25d405` (contains the maintenance packet and accepted MNT-01) |
| Tested source candidate HEAD | `5bf87a7b757d3ab322319fc1e618f3bf5c7d0778` |
| Tested source tree | `95c9ce49a779976dc90f664103946b6d5d98f512` |
| Working directory | `C:\Users\Ermolz\.codex\worktrees\translate-task-discovery\auralis-translate` (registered managed worktree) |

The report-only commit follows the tested source candidate. Its hash is recorded
in the handoff, since a committed file cannot contain its own commit hash.
The shared `main` checkout's staged backlog and site changes were not touched.
MNT-01 documentation remains at this base; final onboarding reconciliation
belongs to MNT-01 after accepted maintenance code.

## Problem and responsibility map

The 4,298-line root catalog mixed everyday checks with opt-in historical
experiments. At the base, Task listed 657 public entries, 58 root tasks had
`requires` blocks and 188 had `env` blocks. No `default` task, task alias or
per-task working-directory override was present. The inventory and dry runs
identified CLI argument forwarding, required asset variables, sequential check
dependencies and root-relative paths as the relevant command contracts.

| Owner | Final responsibility |
| --- | --- |
| `Taskfile.yml` | Root include declarations and unchanged historical experiment, model, network, native, site and release commands. |
| `taskfiles/developer.yml` | Existing `fmt`, `fmt:fix`, `lint`, `test`, `check`, `docs:check`, `plan:check`, `inspect` and `cli` commands, flattened under their original public names and executed at the root. |
| `taskfiles/maintenance.yml` | Four new explicit, model-free catalog/provider/CLI/report commands for this maintenance packet. |
| `eval/scripts/check-maintenance-task-catalog.mjs` | Bounded comparison with the immutable base Taskfile via Task's catalog and dry-run interfaces. |

The exact new commands for dependent agents are `task maintenance:test:provider`
(MNT-03), `task maintenance:test:cli` (MNT-04) and
`task maintenance:test:report` (MNT-05). `task maintenance:catalog:check`
checks this extraction. The provider wrapper covers protocol, versioned
profiles, context/token behavior, request journaling, cancellation and SQLite
journal migration tests. The CLI wrapper covers process protocol, pause/resume,
verified server, export and immutable edit/result tests. The report wrapper
reuses `eval:report:check` and `site:check`; it does not capture evidence or
publish. All use local fixtures or retained report data.

## Behavior comparison

| Boundary | Before | After / evidence |
| --- | --- | --- |
| Public catalog | 657 available tasks. | Same 657 names, task identities, descriptions, summaries and aliases; only four `maintenance:*` tasks added. `task maintenance:catalog:check`. |
| Moved checks | `fmt`, `fmt:fix`, `lint`, `test`, `check`, `docs:check`, `plan:check` lived at root. | Exact dry-run commands match the base. `check` still calls `fmt`, `lint`, `test` in that order. Root include has no `dir`. |
| CLI argument forwarding | `inspect` and `cli` expand `CLI_ARGS`. | Same dry-run expansion with a synthetic fixture path. No CLI command executes in the catalog check. |
| Required variables | Asset-dependent tasks refuse missing variables. | Supplied-variable dry runs and missing-variable refusals match for `eval:cli:local:e2e` and `eval:token-count:parity`. |
| Site entrypoints | `site:build` rebuilds both local pages; `site:check` verifies both and supporting evidence. | Definitions and dry-run order match. A local rebuild produced the same normalized Git hashes as HEAD: `site/index.html` `d074bfa1d7564b204b525b42da0cb50f99fdbda3`, `site/history.html` `26c8e515d4b6861e0cbee36f11ecb07c4e1b6261`. |
| Default and opt-in boundary | No default task; experiments specify their own model/network actions. | Still no default task. The new wrapper dry runs contain contract tests and no fetch, model-server, probe or capture command. Historical experiments were not moved. |

The catalog check temporarily writes the base Taskfile beside the root
Taskfile, compares Task JSON catalog metadata and dry-run outputs, and removes
that temporary file in `finally`. It requires the recorded base commit to be
available locally; a shallow checkout lacking that commit must fetch history
before this maintenance check can pass. It does not execute any experiment.

## Commits and review size

| Commit | Purpose | Ordinary added/deleted lines | Rename-aware added/deleted lines |
| --- | --- | --- | --- |
| `e25b6d0` | Extract the small developer command group without changing public names. | 39/31 | 39/31 |
| `5bf87a7` | Add focused maintenance entrypoints and catalog equivalence guard. | 111/0 | 111/0 |

No generated file was committed. The report-only commit is recorded in the
handoff. The ordinary and `-M` counts are equal because no Git file rename was
used; command definitions were deliberately copied into the included Taskfile
and removed from root in one reviewable step.

## Verification

Source-candidate commands below ran from the managed working directory above.
Base commands ran from the separate clean checkout at
`E:\Anything\Projects\Commercial\auralis-translate\.cache\worktrees\translate-task-discovery`,
while it was still at the recorded base. Exit codes are observed process exit
codes, not release or model-quality conclusions.

| Phase | Exact command | Exit | Observed result |
| --- | --- | --- | --- |
| Base | `task docs:check` | 0 | 560 Markdown files; local links valid. |
| Base | `task plan:check` | 0 | 59 canonical tasks, acyclic dependencies, six document identities. |
| Base | `task fmt` | 0 | Rust formatting unchanged. |
| Base | `task lint` | 0 | Offline workspace Clippy with denied warnings. |
| Base | `task site:check` | 0 | Two-page public boundary and retained evidence valid. |
| Extracted commands | `task docs:check`, `task plan:check` | 0 each | The included commands still execute at the root. |
| Focused | `task maintenance:catalog:check` | 0 | 657 original catalog entries, nine moved command expansions, six representative expansions and two required-variable refusals match the base. |
| Focused | `task maintenance:test:provider` | 0 | Offline provider and SQLite journal/migration suites passed. |
| Focused | `task maintenance:test:cli` | 0 | Offline CLI process/resume/export and result history suites passed. |
| Focused | `task maintenance:test:report` | 0 | Seven experiment-record tests and both report-page verification paths passed. |
| Site | `task site:build` | 0 | Local pages rebuilt; normalized Git hashes equal HEAD; no generated artifact change. |
| Site | `task site:check` | 0 | Rebuilt pages and source/evidence boundary passed. |
| Source candidate | `task check` | 0 | `fmt`, offline Clippy and workspace tests/doc tests passed in order on the committed source candidate. |
| Source candidate | `task docs:check`, `task plan:check` | 0 each | 560 Markdown files and 59 canonical tasks verified before this report. |
| Report draft | `task docs:check`, `task plan:check` | 0 each | 561 Markdown files and the same 59 canonical tasks verified. |

The first sandboxed catalog attempt failed with `spawnSync git EPERM`; the
permitted elevated rerun then exposed a harness mistake: Task writes dry-run
commands to stderr, which the initial script did not compare. Capturing both
streams corrected the guard, and the final check passed. A sandboxed provider
run failed to create Cargo's target directory (`os error 5`), and a sandboxed
site build could not write the local generated page (`EPERM`); both passed when
rerun with the required worktree write access. These were environmental
permissions, not failures of the underlying checks.

The model-dependent, network, media, native desktop, clean-install and
language-quality checks were intentionally not run. Workspace tests reported
the ignored `repeated_journal_finishes` bounded storage workload; other
explicitly ignored asset-dependent tests were not promoted by these wrappers.
The documentation checker does not validate anchors or external links.

## Interface and integration limits

No Rust public API, CLI protocol, serialized field, runtime configuration,
database schema, profile, model manifest or frozen experiment file changed.
The only new public interface is the four additive Task commands named above.
No Auralis repository or Translate gitlink was changed. The Task command map
was checked against the actual source definitions and `docs/DEVELOPER_GUIDE.md`;
the common developer guide still describes `task check`, local CLI use and
local-only site generation accurately. MNT-01 should document the new focused
commands in its final onboarding pass after candidate integration.

The receiving reviewer should inspect both commits and this report, rerun the
catalog and focused wrappers on the committed candidate, then record
`accepted`, `changes_requested` or `blocked_by_environment`. MNT-03 through
MNT-05 should start from a base containing these task entrypoints. This report
does not mark MNT-02 done in the canonical backlog; the coordinator owns that
integration and generated public progress.
