# Maintainability review and agent assignments

Reviewed on 17 October 2026. This work improves documentation and internal code
organization in Auralis Translate and Auralis while preserving existing behavior.
The files below are execution prompts for a later implementation stage. No agent
implementation, branch creation, commit, model run or release is activated here.

Start with the [review](REVIEW.md) and [agent contract](AGENT_CONTRACT.md).
Repository `AGENTS.md` and the existing product contracts remain authoritative.

## Assignments

| Proposed ID | Assignment | Unique branch | Execution dependency |
| --- | --- | --- | --- |
| MNT-01 | [Current documentation and onboarding](agents/01-documentation.md) | `docs/translate-current-documentation` | First documentation pass; final reconciliation after other Translate assignments |
| MNT-02 | [Task discovery and maintenance commands](agents/02-task-discovery.md) | `chore/translate-task-discovery` | Before adding checks needed by MNT-03 through MNT-05 |
| MNT-03 | [Provider module responsibilities](agents/03-provider.md) | `refactor/translate-provider-modules` | MNT-02 check entrypoints available |
| MNT-04 | [Durable CLI orchestration](agents/04-cli-workflow.md) | `refactor/translate-cli-workflow` | MNT-02 check entrypoints available |
| MNT-05 | [Report assembly and verification](agents/05-report-tooling.md) | `refactor/translate-report-tooling` | MNT-02 check entrypoints available |

These IDs name proposed maintenance slices. The canonical
[implementation backlog](../IMPLEMENTATION_BACKLOG.md) retains all current product
statuses. At dispatch, register the selected slices there with scoped acceptance
links and dependencies; account for them in generated progress. Do not maintain a
second product status table here or mark any release gate passed by this work.

The Auralis checkout has its own `docs/maintenance/README.md`, agent contract,
five local assignments and one final integration assignment. The integration
agent alone advances the Auralis Translate gitlink if library changes are accepted.

## Execution order

1. Freeze the implementation bases and give every agent an isolated worktree.
   Include this planning packet in those bases. Register selected maintenance IDs
   and allocate shared backlog/report changes before implementation starts.
2. Run MNT-01 and MNT-02 independently. MNT-01 owns documentation; MNT-02 owns
   Taskfiles. Coordinate new command documentation through MNT-01.
3. Run MNT-03, MNT-04 and MNT-05 independently once their check commands exist.
   They own separate code subtrees; do not share a provider refactor between agents.
4. Review and integrate one branch at a time. MNT-01 then reconciles documentation
   against the accepted source tree and regenerates affected progress/report data.
5. Accept the committed Translate candidate before Auralis advances its gitlink.
   Documentation-only changes do not require a pin update.

All implementation reports follow the [common contract](AGENT_CONTRACT.md).
