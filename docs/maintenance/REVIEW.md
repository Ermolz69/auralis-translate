# Maintainability findings

## Scope and inspected revisions

The review covers the two local repositories only. Auralis Translate was clean
on `main` at `5749fb72b43569c313410fb1422892272e852432`; Auralis was clean on
`main` at `321be7f7c8914ea3bea9b9d43256072266680015`. Auralis currently pins
Translate `44e7d4f3c6ce2443279f5d0d3acd07cbb931476e`, so its embedded library is
not the same candidate as the sibling Translate checkout. Future agents must
record their actual bases rather than reuse these hashes as current state.

This is a repository survey with focused source inspection and baseline checks,
not a claim that every line, race or platform has been audited. Findings below
are maintainability issues; they are not established functional defects.

## Existing strengths

The six-crate workspace already separates domain/application contracts, formats,
SQLite, llama.cpp, CLI composition and evaluation. Core exports remain independent
of SQLite, HTTP, Tauri and filesystem paths. Runtime behavior tests are under
crate `tests/` directories. Model/prompt profiles, protected subtitle bytes,
durable checkpoints and immutable results have explicit contracts.

Most production Rust files are already modest in size. There is no justification
for a general architecture rewrite, a new service framework or patterns added
only for their names. Preserve these boundaries and improve specific owners.

## Documentation findings

| Priority | Evidence | Required correction |
| --- | --- | --- |
| High | Root README says public publication is deferred; `REMAINING_WORK.md` says GitHub and Pages publication occurred. | Reconcile current statements against repository/workflow evidence and retain dated historical decisions. Do not infer live deployment from a workflow file. |
| High | `architecture/003-auralis-integration.md` describes CLI-owned runtime lifecycle as future work; `local_model_server.rs`, local commands and October acceptance records implement it. | Describe both caller-supplied and CLI-owned server paths with their limits. |
| High | `docs/README.md` opens with a 26 September status. `IMPLEMENTATION_STATUS.md` leads with a historical 49-task count; `task plan:check` now observes 58 tasks. | Give new readers a short current capability map and links to authoritative status, without hand-copying changing counts. |
| Medium | `DELIVERY_PLAN.md` still leads with deferred desktop work and early context plans; later scope/backlog records authorize desktop work and implement newer profiles. | Label historical scheduling and experimental baselines; point to the latest governing scope without changing release requirements. |
| Medium | `IMPLEMENTATION_BACKLOG.md` is 1,395 lines and mixes the canonical table with long handoffs. The index also repeats historical edits as current pending work. | Keep stable task rows and acceptance links; move narrative only where links, generated identities and provenance remain intact. |
| Medium | The architecture's suggested tree is explicitly illustrative and no longer serves as a current navigation map. | Add a concise actual module/read-path map, separate from historical examples. |

The documentation checker verifies local file existence but explicitly excludes
anchors and external URLs. A passing check therefore does not resolve these
contradictions or prove onboarding correctness. The review does not verify current
third-party model specifications or remote publication.

## Code and tooling findings

| Proposed assignment | Source evidence | Responsibility to separate | Invariants at risk |
| --- | --- | --- | --- |
| MNT-03 | `crates/auralis-translation-llamacpp/src/provider.rs`, 827 lines; `provider_v7.rs`, 384 lines | Provider construction/probing, token preflight, v5/v6 line execution, journal records and version dispatch coexist. | Exact request shape, token-count runtime switch, context trimming, error precedence, cancellation, journal begin/finish and diagnostics. |
| MNT-04 | `crates/auralis-translation-cli/src/durable_workflow.rs`, 285 lines | Profile/policy helpers, preflight journal, attempt execution, result commit and offline export share a file; `execute` spans most of it. | Preflight before attempt, checkpoint reuse, pause classification, source verification, no-overwrite output and stdout protocol. |
| MNT-05 | `eval/scripts/current-report-data.mjs`, 1,400 lines; `check-public-demo-site.mjs`, 945 lines | One large report projection and sequential verification body obscure data ownership and omissions. | Exact evidence content, failure visibility, privacy exclusions, safe escaping and both generated report pages. |
| MNT-02 | Root `Taskfile.yml`, 4,298 lines | Everyday development commands are buried among historical experiment commands. | Existing task names, variables, dependencies, working directory and explicit model/network invocation. |

String-based error classification in the provider is a future design concern.
This maintenance scope may isolate the classifier while preserving its behavior;
changing public errors, retry categories or persisted outcome semantics is separate
work. Likewise, SRT and WebVTT planning have intentionally different capabilities;
similar code alone does not justify unifying their grammars or scene support.

Keep published experiment files, profile manifests and retained failures immutable.
Refactoring can invalidate source/build receipts even when behavior is preserved.
Record new candidate identities and new acceptance evidence instead of updating old
hashes to make checks pass. Report loaders may be reorganized; historical probes
must not be rerun or silently retargeted by a report build.

## Baseline verification

Checks executed from this checkout before creating the planning files:

| Command | Observed outcome |
| --- | --- |
| `task docs:check` | Passed; 549 Markdown files; external links and anchors excluded. |
| `task plan:check` | Passed; 58 tasks, valid states, acyclic dependencies and six document identities. |
| `task fmt` | Passed. |
| `task lint` | Passed; offline workspace Clippy with denied warnings. |
| `task test` | Passed; offline workspace tests and doc tests. Explicit asset/private-corpus and opt-in probe tests remain ignored. |

No real inference, media acquisition, native desktop launch, installer or language
quality gate belongs to this survey. Each implementation agent must reproduce
its focused baseline and final checks at its own committed candidate.
