# Historical edit desktop contracts and review controls

Date: 26–27 September 2026. Local development evidence, following
[the application branch record](2026-09-26-historical-edit-application.md).
This is supporting backend/component evidence, not a native desktop or language
release verdict. S7 remains open.

## Implemented path

The production Tauri composition exposes three separate commands:

- `get_historical_translation_edit_context_cmd` verifies the ready managed base,
  its frozen run and the current validated head of that same run. Its response
  contains scoped identifiers, base/head revisions and the observed host link
  revision. Another unfinished active run does not redirect this observation.
- `edit_historical_translation_result_cmd` calls the journaled explicit branch
  use case with the supplied result UUID, observed head/link guards and lines.
  It remains separate from the ordinary latest-base-only command.
- `get_translation_publication_cmd` reads publication, project selection and
  artifact state within one SQLite read transaction. It rejects wrong ownership,
  a ready publication with a nonready artifact, and a selected publication whose
  ready state/artifact contradicts the link. It performs no selection or file write.

Frontend contracts validate identities and safe positive revisions. API adapters
check the requested project/translation/base or result scope again. Translation
command validators have their own module; the central IPC dispatcher retains
complete static command-map coverage.

The experimental review controls allow editing any verified ready preview. They
observe the guards before enabling save, freeze the full request and result UUID,
disable line changes once attempted, and retain the same request after an unknown
save response or publication failure. A confirmed precommit conflict offers a new
observation and UUID. A synchronous busy guard prevents duplicate clicks.

Changing the project/base/segment invalidates the editor's context and callbacks.
Opening is scoped to that identity so switching bases does not start an unintended
context request. A committed edit can finish publication after its editor is gone,
but its late response does not update the new editor.

Publication status is outside the changing comparison page and scoped to the
project/result. Pending output polls every three seconds, ready output stops that
poll, and committed project refreshes or the manual refresh recheck selection.
The notice distinguishes ready attached, ready historical, pending and failed
output. A failed refresh remains visible; stale ready state is cleared. Reopening
uses existing history and startup recovery; the notice itself is not durable.

## Supporting observations

Three additional application tests use the existing actual import, Translate
engine, two SQLite files, managed files and outbox fixture:

1. A historical base observes its own head while another registered run remains
   unfinished. A later branch makes the old observed head conflict; a fresh
   observation permits another branch and preserves that active run.
2. Foreign project ownership, an unpublished base and a corrupt frozen profile
   reject context acquisition.
3. Reads concurrent with outbox finalization return pending/old selection or
   ready/new selection, never a mixed pair in this probe. A later explicit choice
   reports the prior branch as ready historical. Missing/foreign results and a
   nonready managed artifact reject observation.

The comparison/editor/notice component tests exercise exact retry guards and
lines, duplicate clicks, lost responses, confirmed conflicts, obsolete contexts
and callbacks, a wrong committed identity, polling teardown, changed selection,
read errors and an older-base panel save during another active run. The integrated
panel test retains its notice across preview changes. IPC/API tests reject invalid
revisions, contradictory publication snapshots and cross-scope responses.

The provider in the backend fixture is deterministic. React tests mock IPC and run
in jsdom. Compilation checks command registration and composition but does not
exercise native serialization, WebView interactions or the checked model.

During development, one corruption fixture initially used the nonexistent
artifact state `pending`; SQLite correctly rejected it. It now uses the declared
`pending_finalize` state. A component setup callback accidentally returned a mock
function as teardown; it now returns nothing. The genuine extra-context request
on a changed base was fixed in the scoped editor. No diagnostic logging remains.

## Successful checks in the Auralis checkout

- `task rust:fmt-write`.
- `task rust:test:application -- --test translation_historical_edits --test translation_publish --test translation_vtt_publish --test translation_publication_recovery --test translation_result_gap_recovery`:
  13 passed (eight branch/observation tests and five publication/recovery tests,
  including the existing subprocess child harness).
- `task rust:clippy`: workspace/all-target checks passed with denied warnings.
- `task frontend:test:components -- src/features/translation-review`: 17 passed.
- `task frontend:test:unit -- src/entities/translation/api/translationHistoricalEdit.test.ts src/shared/api/contracts/runtimeValidation.test.ts src/shared/api/contracts/translationHistoryValidation.test.ts src/shared/api/contracts/translationHistoricalValidation.test.ts`:
  23 passed.
- `task frontend:typecheck` and `task frontend:lint`: passed without warnings.
- `task quality:file-size`: eight checker tests and all module limits passed.
- `task quality:ipc-contract`: five checker tests and Rust/TypeScript parity passed.
- `task quality:format-write -- apps/desktop/src/entities/translation/api/translationHistoricalEdit.test.ts apps/desktop/src/features/translation-review/ui/TranslationPublicationNotice.test.tsx`:
  passed for the final targeted frontend formatting step. Earlier targeted steps
  formatted the other changed frontend files.

- `task quality:fsd-boundaries`: six configuration tests, frontend ESLint and
  internal import-checker tests passed; no forbidden deep imports found.

- Host `task quality:format-write -- docs/translation/README.md`: passed.
- Host `task docs:check`: five checker tests passed; 31 Markdown files and
  11 mandatory documents validated.
- Translate `task docs:check`: 82 active Markdown files validated. External links
  and anchors are outside that checker.

No model weights, runtime payloads or external corpus data were added.

## Remaining gate

The later [native historical branch record](2026-09-27-native-historical-branch.md)
supplies the completed older-base save, explicit selection and reopening evidence
that was pending at this snapshot. Manual-save process-kill boundaries remain open.

Run the actual checked-model Tauri older-base edit, verify untouched segments come
from that older base, conflict with a later project choice, and reopen both
databases and ready files. Kill the desktop at journal/core/publication boundaries
and confirm independent recovery without replaying inference or overriding newer
selection. The standalone CLI historical branch interface, broader diagnostics,
user review, language and clean Windows delivery gates remain open. All work and
commits remain local; public publication stays deferred by the owner.
