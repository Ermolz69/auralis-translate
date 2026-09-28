# V5 inference request journal: deterministic contract checks

Date: 29 September 2026. Task: `CTX-02` (partial). Scope: CLI v5 chat-completion
requests and Translate SQLite schema migration 6 to 7. This is a fixture-level
engineering check; no model, audio or language review ran in this slice.
Implementation commit: `3625913`. The unrelated working-tree edit in
`docs/architecture/014-result-history-selection.md` was excluded.

The preceding failure was that `ProviderResponse` exposed only accepted strings:
an invalid v5 object could fail validation before its raw response reached
Translate SQLite. The minimal provider control returns malformed JSON. The test
checks the exact serialized request and rejected raw response in a journal sink.
A separate failure control makes the journal reject the start and confirms no
network connection is opened. SQLite controls reopen a pending request, retain a
rejected response next to a later accepted one, reject changed request identity
and invalid source positions, and upgrade a populated v6 run without changing
its translation or block plan.

Checks run from the Translate workspace:

- `task test:inference-journal`: 2 inference repository, 7 migration and 8 v5
  provider tests passed after the implementation.
- `task test:context-v5`: 7 provider and 2 CLI admission tests passed before the
  final additional control; the 8-test provider suite was repeated by the journal task.
- `task lint`: passed after correcting a Clippy warning in the new fixture.
- `task test`: first run exposed an old v5 migration fixture that left the new
  v7 table in place; after correcting the fixture, the full offline workspace
  suite passed (exit 0).
- `task test:result-edits`: passed after that fixture correction, including
  legacy result branches and project cleanup.
- `task fmt`, `task plan:check`, `task docs:check`, `task site:build` and
  `task site:check`: passed; the site checker retained 420 prior requests.

Open evidence: real-model attempts using the new journal, preflight request
logging, Auralis worker wiring, bounded long-file recovery and source-aware
human review. No acceptance gate or whole `CTX-02` completion is claimed.
