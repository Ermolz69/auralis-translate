# Historical edit engine and host journal foundation

Date: 26 September 2026. Local supporting evidence, not a native branch-edit or
language-quality gate. No model assets were downloaded or included in a package.

## Implemented behavior

Translate `commit_branch_edit` takes an immutable text base and an explicitly
observed head from the same run. It copies only the chosen base, guards the head
inside an immediate transaction, and appends the next per-run revision. Ancestry,
manual edit text, selections and result commit together. Exact UUID retries remain
idempotent after later edits; changed ancestry/payload conflicts. Ordinary edits
retain their latest-base-only behavior.

Schema v6 records base/head/segment provenance for new edits. An actual populated
v5-shaped database migrates without inventing old ancestry, losing results or
breaking legacy exact retries. Origin reads reject altered ancestry or missing
selected manual text. Cleanup removes branches without foreign-key violations.

Auralis schema v10 adds a metadata-only edit journal and a narrow store port.
Admission checks owner, observed link revision, ready owned translated base and
frozen run. It preserves request identity and the original timestamp on retry.
Recovery enumeration remains independent of selected/active runs and uses cursor
pages, so earlier absent results cannot prevent examining later intents. Ready
publication alone is insufficient to leave recovery: its translated artifact
must also be ready and owned by the same project. Deletion cascades the journal.

## Commands and observed results

In the independent Translate checkout:

- `task fmt:fix`: passed.
- `task test:result-edits`: 16 passed: seven SRT branch tests, one independent
  WebVTT branch test, one ordinary-edit regression, six migrations and one cleanup.
- `task check`: passed workspace formatting, Clippy with denied warnings, all
  workspace tests and doc tests. Existing CLI edit/resume and machine protocols
  remain passing.

In Auralis:

- `task rust:fmt-write`: passed.
- `task rust:test:storage -- --test translation_edit_intents --lib`: 144 existing
  library tests and six journal integration tests passed.

The first additional fixture compilation exposed test-only assumptions about
Clone implementations and the VTT execution facade; those were corrected to use
the actual public API. One existing host migration regression initially still
expected schema 9; its expectation was updated to 10 and the named suite passed.

## What the tests actually cover

The SRT tests use two cues and divergent edits. A later branch retains untouched
text and inherited selections from the chosen old base, not the newer head.
Two real SQLite connections compete for one observed head: exactly one commits.
A stored head belonging to another validated run is rejected. Changed retries,
malformed edits and stale ordinary edits leave no partial rows. Reopening,
corrupt ancestry/manual selection, migration and deletion are checked.

The independent WebVTT path runs the real strict parser/renderer and SQLite with
a stable fixture provider. It preserves an exact `NOTE` block, one external cue ID,
one absent ID, timings and CRLF. The expected whole output is compared byte for
byte; later-base text is excluded, markup edits are rejected, the prior versions
and checkpoints remain unchanged, and an exact retry passes after reopening.
These are structural checks using a mock provider, not linguistic evidence.

The host tests use real SQLite pools and concurrent transactions. They verify
changed selection plus a different active run, exact retry/reopen, owner/base/run
and hash validation, a concurrent UUID collision, bounded pages, ready-artifact
filtering, cascading deletion, schema 9 upgrade and corrupt/future-schema refusal.
Ready/unattached publication rows are arranged by the test: this does not exercise
the still-unimplemented manual branch finalizer or automatic-publication race.

## Open product work

The host editor, application intent construction, startup recovery, separate
manual publication/final attachment transaction, CLI branch command, typed IPC,
React controls and native checked-model older-base save/reopen remain pending.
The older history-selection native record does not prove this new workflow.
Concurrent automatic publication must remain recoverable and must preserve newer
user choices. S7 is open; language and clean-install release gates are unchanged.
