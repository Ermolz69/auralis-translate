# HOST-01: uncertain historical-publication commit response

Date: 29 September 2026. Auralis candidate branch:
`feat/real-tts-pilot` at `5c33ef2a0f93379521cff100e2555bc2b80d1e1c`.
This is a bounded engineering result, not HOST-01 or G7 acceptance.

## Reproduction and change

The Auralis publisher imported a verified historical result into managed
staging, then unconditionally deleted that staging key whenever
`commit_staged_publication` returned an error. A response loss after the
SQLite transaction committed could leave a durable publication, artifact and
finalization outbox pointing to a deleted file. The change reads the exact
publication after an error. It retains staging when that record matches the
attempt or when the confirmation read fails. It cleans only the attempt's
staging after a confirmed absent or different record. No pending result is
attached by this reconciliation.

The new deterministic regression uses both real SQLite files, managed local
files and the ordinary outbox. For each of SRT and WebVTT it injects an error
before commit, after durable commit, and after durable commit with an
unavailable confirmation read. It checks staging cleanup or retention,
outbox recovery after reopening, immutable source bytes and an explicitly
chosen older result that remains selected. An earlier test setup incorrectly
expected selection to remain unchanged without recording a choice; a second
setup tried to choose during a pending publication and correctly got `Busy`.
The final fixture makes the explicit choice before staging. These setup
failures are retained in the Auralis contract record; they do not establish
product faults.

## Checks and limits

- `task host:publication:uncertain:check`: passed, 9 application tests
  (including six format/fault combinations) and 8 storage tests.
- `task rs:fmt`: passed after `task rs:fmt-write` corrected formatting.
- `task rs:clippy`: passed for the workspace, all targets, warnings denied.
- `task docs:check`: passed 5 checker tests and 45 Markdown files. Its first
  sandbox run could not spawn the Node child (`EPERM`); the same task passed
  with process permission.

This injects storage-response failures; it is not a native process kill at
the staged/outbox boundary. HOST-01 still requires that kill/restart check,
preservation across other publication interleavings and the release's clean
Windows target. Auralis remains a local private branch while permission to
push it is unresolved. No model, source subtitle, human review or audio claim
follows from this test.
