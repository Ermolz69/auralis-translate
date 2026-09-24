# S4 strict-SRT durability gate

Date: 24 September 2026. Scope: one Translate SQLite file, strict UTF-8 SRT, Chinese → Russian, local provider interface. This gate measures durable state behavior; it does not measure linguistic quality or Auralis integration.

## Evidence

`task check` passed formatting, Clippy, and 35 behavior tests. Relevant tests:

| Test | Injected condition | Observed invariant |
| --- | --- | --- |
| `tests/recovery.rs` in the SQLite crate | Database handle dropped while run is `running`, then reopened; manual pause; changed profile. | One open attempt becomes `paused`, committed block remains, uncommitted block is absent, the next attempt continues, and profile change conflicts. |
| `tests/durable_run.rs` in the SQLite crate | Provider fails on block two; input text or full plan changes. | Reopened run asks the provider only for the missing block; changed input is rejected before a model call; a truncated block list cannot be reported complete. |
| `tests/srt_durable_document.rs` in the SQLite crate | Model fails after one block, database reopened, then resumed. | No result exists while incomplete. A separate SRT is rendered after completion; `result_id` is immutable and idempotent; the stored segment selection plus original regenerates the same output SHA-256. |
| `tests/cli_resume.rs` in the CLI crate | Mock HTTP provider fails on the ninth request; source/profile changes; output already exists. | Eight-cue checkpoint survives, CLI resumes only the last cue, stores a validated result, rejects changed source/profile without publishing, re-exports after server shutdown, and refuses overwrite. |
| `tests/segments.rs` in the SQLite crate | Reopen and conflicting source text ranges. | Ordered source text, timing, cue label and byte ranges survive; a changed map conflicts without replacing stored data. |

The CLI writes its managed original to `STATE_DIR/sources/<translation_id>.srt` and stores its SHA-256 in Translate SQLite. The external original is only read. The result repository requires the format adapter's `VerifiedRenderer`; it renders the selected checkpoint text, reparses the SRT, checks protected bytes and structure, and stores the output digest in the same transaction that marks the run `validated`.

## Gate conclusion and remaining work

The [S4 gate](../../docs/IMPLEMENTATION_STAGES.md) is met for the strict SRT and local SQLite path. The real-model [durable CLI smoke](2026-09-24-durable-cli-smoke.md) completed and re-exported; injected interruption of a real model remains separate S6 evidence. Source-copy retention/cleanup, user-facing cancellation/progress, model identity attestation, quality diagnostics, atomic output publication, WebVTT, and the Auralis database link are later gates.
