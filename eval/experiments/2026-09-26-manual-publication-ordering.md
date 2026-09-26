# Explicit manual translation publication ordering

Date: 26 September 2026. Local Auralis storage/outbox foundation. The historical
save command, journal replay, frontend controls and native branch workflow remain
pending.

## Implemented boundary

An existing schema v10 edit intent identifies an explicit manual branch. Staging
validates its project/translation/run and original expected link revision, a ready
owned base with its frozen run, a later result revision and the engine's required
manual `Needs review` projection. Finalization rechecks this base/revision/review
metadata in the same transaction. It allows current
selection or active-run changes after intent admission. Artifact, publication and
outbox rows commit atomically; invalid metadata rolls back the complete write.
Exact staging retries keep one artifact and one finalization outbox entry.

`TranslationLinkStore::finalize_ready_publication` now owns one immediate
transaction and dispatches to separate automatic/manual operations. Manual
completion requires a ready managed translated artifact. It attaches only at the
intent's still-current link revision with no pending automatic publication there,
and preserves the active run. Otherwise it marks the result ready for history and
keeps the current project link. Ready manual completion is terminal: replay after
reopening never silently attaches a previously detached result. Explicit verified
history selection remains the later user action.

The outbox candidate query includes manual results after selection/run changes.
Automatic precedence and candidate enumeration exclude explicit manual branches.
A selected newer manual revision blocks an older automatic admission from that
same run. A different retained active run can publish at the new current link
revision. Existing ordinary edits without an explicit journal retain their legacy
automatic revision precedence.

## Supporting checks

- `task rust:fmt-write`: passed.
- `task rust:test:storage -- --test manual_translation_publication --test translation_history --test translation_edit_intents --lib`:
  164 passed: 144 storage library tests, eight manual-ordering tests, six existing
  history tests and six journal tests.
- `task rust:clippy`: passed workspace/all-target checks with denied warnings.
- `task quality:file-size`: passed eight checker tests and all architectural file
  size limits.
- `task quality:format-write -- docs/translation/README.md`: passed targeted host
  documentation formatting.
- Host `task docs:check`: passed five checker tests and validated 31 Markdown
  files, including 11 mandatory documents.
- Translate `task docs:check`: validated 80 active Markdown files.
- `task rust:test:application -- --test translation_publish --test translation_publication_recovery --test translation_result_gap_recovery`:
  four passed, including the child harness and the existing real worker-kill/two-
  restart result-gap regression. These retain ordinary two-database publication
  behavior after the port rename; they do not execute an explicit manual branch.

The new named tests cover:

1. An unready output cannot attach; exact stage/finalization retries produce one
   artifact/outbox and one link update.
2. Changed historical selection plus another active frozen run allows staging,
   ready detached history, reopening and later explicit selection, with the active
   run preserved.
3. A pending automatic publication causes the manual branch to remain detached.
   The lower automatic revision stays eligible and completes successfully.
4. Manual attachment preserves another active host run. A stale automatic stage
   fails, then a stage at the new link revision can complete.
5. Changed run/link/review metadata or an unready base rolls back the artifact and
   outbox. Altering a staged revision to the base revision prevents finalization
   and leaves the link/publication unchanged; restoring it permits completion.
6. Two real SQLite transactions concurrently finalize a manual result and stage
   an automatic result. Either automatic staging wins and the branch detaches, or
   the branch attaches and stale automatic staging fails; restaging at the current
   link revision retains the new active run's result.
7. A selected newer manual revision rejects older automatic staging from that run.
8. Concurrent manual staging and explicit historical choice preserve transaction
   order: an earlier choice is retained, or staging makes the choice BUSY and the
   branch attaches when its artifact becomes ready.

Fixtures use real SQLite pools and transactions. They explicitly arrange host
frozen-run/publication metadata and artifact ready states. No model or actual
Translate run executes in these eight tests. Assertions establish the host
transaction contract; cross-database branch-save/replay, actual file hashes and
native process interruption still require their own integration evidence.

## Remaining delivery

The application editor does not yet admit journal requests or call the branch API.
Startup does not yet find a saved historical edit through journal pages. The
publisher still resolves ordinary linked results until it is supplied with a
verified historical intent and request/provenance check. Keep historical save
controls unavailable until that route, typed IPC/UI and native older-base save,
conflicting attachment and reopening are verified. S7 and the language/installation
release gates remain open. All development and commits remain local.
