# Translate durable CLI assignment

Execute proposed ID `MNT-04` on `refactor/translate-cli-workflow` after required
MNT-02 commands exist. Read the [agent contract](../AGENT_CONTRACT.md).
Own `crates/auralis-translation-cli/src/durable_workflow.rs`, new private modules
extracted from it, minimal declarations and focused CLI tests. Other CLI source
may be read; widening edits requires coordination. Do not unify CLI composition
with the Auralis executor or refactor local process ownership in this slice.

## Sequence

1. Trace start/resume and validated offline export into the durable workflow.
   Map preflight journal, admission guard, attempt start, inference journal,
   timed execution, checkpoint/result commit and separate-file output.
2. Reproduce existing process tests for SRT/WebVTT, machine JSON/JSONL,
   already-existing output, profile/source mismatch, preflight failure, pause,
   failed result persistence and re-export without inference. Fill only relevant
   coverage gaps with owned fixture databases and mock servers.
3. Move preflight reporting, attempt/result lifecycle or offline export into
   private owners one at a time. Keep `execute` readable as ordered orchestration.
   Do not introduce a generic workflow framework or change `Box<dyn Error>`
   boundaries throughout unrelated commands.
4. Preserve opt-in timing names, measurement boundaries and failure observations.
   If a build receipt is invalidated, produce a new receipt for a separately
   checked candidate; retain old receipt and source-tree history.

## Acceptance

Public arguments, output envelopes, event order, stdout/stderr placement, exit
codes and output-conflict behavior match the base. No attempt starts before the
same preflight/admission checks. Accepted checkpoints survive resume unchanged.
Offline export performs no inference and still rejects mismatched output identity.
Output creation remains non-overwriting and occurs after durable validated result
commit. Cancellation, pause classification and failure cleanup retain their order.

Run the MNT-02 focused CLI command, `task test:cli:protocol`,
`task test:cli:local`, `task test:verified-server`, `task test:preparation`,
`task test:request-cancellation`, `task test:result-edits`, `task fmt`,
`task lint`, `task test`, `task docs:check` and `task plan:check`.
Tests requiring real assets remain explicitly open unless separately executed.
Submit the common report with a lifecycle ordering diagram or table and captured
process-contract comparisons. Keep each extraction independently buildable.
