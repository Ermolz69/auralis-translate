# Historical edit application save and recovery

Date: 26 September 2026. Local application/adapter integration. Supporting
two-database and file evidence; no new real-model or native historical-save claim.

## Implemented path

`VerifyTranslationHistoryUseCase` reconstructs a ready owned historical result,
checks its frozen source/parser/profile/block policy and verifies the managed
artifact size/digest. Explicit history selection uses this same verifier.

`EditHistoricalTranslationUseCase` verifies that base, computes the versioned
length-prefixed request SHA-256 and records the metadata-only intent before
calling `TranslationResultEditorPort::commit_branch_edit`. The adapter shares
frozen-run validation with result reading, keeps ordinary edits latest-base-only,
and accepts an explicit branch from an older owned run even while another run is
active. Translate retains the text, ancestry and immutable output selection.

Manual publication uses the admitted run and original host revision. It validates
the frozen run, reconstructed bytes, review state and persisted provenance,
recovers the changed lines and checks their complete request digest. Existing
manual publication retries also check result revision/review/observed host
metadata. Artifact staging/finalization follows the existing managed outbox and
explicit manual ordering transaction.

Publication recovery scans every journal cursor page, advances past missing or
invalid results and isolates their errors. It then performs ordinary linked-run
gap recovery. Production desktop storage/composition supplies the journal to both
publisher and recovery. No recovery path recreates an edit or calls a model.

The growing publisher is split into use-case, manual validation and file-staging
modules. The editor port splits request data and its trait into separate files.
An offline Taskfile lock-refresh operation updates workspace dependency metadata;
the added application SHA-256 dependency uses the existing locked package.

## Supporting scenarios

Five named application tests use actual Auralis and Translate SQLite files,
managed source import, format plans, validated checkpoint/result commits,
historical editing, separate output staging and the real outbox:

1. Both CRLF SRT and WebVTT (with NOTE/cue IDs) branch from the older of two ready
   results. A later second-segment edit is not merged into the branch. After
   explicit selection changes and another frozen unfinished run, closing and
   reopening the host pool recovers ready detached history, preserves the exact
   link/active run and verifies output bytes and ancestry. Exact retries and a
   second reopening retain that choice.
2. Concurrent saves at one observed Translate head have one head winner. Both
   admitted intents remain recorded. The winning result attaches once; its exact
   retry survives a later revision, while changed text with the same ID conflicts.
3. A changed request digest or frozen profile rejects publication before any
   publication/outbox write. Corrupt staged publication revision rejects a retry;
   restoring valid metadata allows completion.
4. A corrupt managed base rejects save before journal admission. Missing persisted
   edit provenance rejects publication; restoring ancestry permits verified
   publication without altering the original or previous managed base.
5. One actual stale-head request leaves an interrupted journal entry. Another 100
   metadata-only entries deliberately arrange the page boundary. After reopening,
   all 101 missing results report isolated failures and the later actual branch
   still publishes. Missing requests are never invented or replayed.

The inference provider is deterministic test code. It exercises the real planner,
validators and durable engine but does not establish linguistic quality or model
support. Reopening deliberately omits publication after a committed branch; it
does not kill a desktop process at that boundary. The unfinished other run is
registered in both databases but has not entered inference.

The initial fixture invocation used an incorrect `.sub` extension and was rejected
by the existing import boundary. The fixture now names its declared SRT/VTT input;
production format admission was not widened.

## Verification

- `task rust:lock:refresh`: completed offline, zero package upgrades; only the
  application dependency list in Cargo.lock changed.
- `task rust:fmt-write`: passed.
- `task rust:test:application -- --test translation_historical_edits --test translation_publish --test translation_vtt_publish --test translation_publication_recovery --test translation_result_gap_recovery`:
  ten passed: five new branch tests and five existing publication/recovery tests.
  The latter count includes the process-gap child harness. The existing gap test
  kills a mock-model worker; it does not prove manual-save interruption.
- `task rust:clippy`: passed workspace/all-target checks with denied warnings.
- `task rust:test:desktop -- bootstrap::storage`: eight passed. These exercise
  storage setup/reopening and its existing configuration/diagnostic checks, not
  the graphical historical-save route.
- `task quality:file-size`: eight checker tests and all architectural limits passed.
- `task quality:format-write -- docs/translation/README.md`: passed.
- Host `task docs:check`: five checker tests passed; 31 Markdown files and 11
  mandatory documents validated.
- Translate `task docs:check`: 81 active Markdown files validated.

The language, installation and complete S7 gates remain open.

## Remaining delivery

This section records the remaining delivery at the application snapshot. The
later [desktop contract record](2026-09-26-historical-edit-desktop-contract.md)
adds supporting typed observation/save/status commands and experimental controls.
Native branch/crash/reopening and the CLI branch route remain open.

Add typed historical observation/save contracts, freeze request IDs in the UI,
represent attached versus ready detached outcomes and connect the explicit save
use case to CLI/IPC/UI. Verify actual process interruption at journal/core/output
boundaries and a native checked-model older-base edit with conflicting selection
and reopening. Keep historical-save controls unavailable until that route is
ready. Weights, corpus payloads and runtime binaries remain separately acquired
and excluded from Git/installers. All changes and commits remain local.
