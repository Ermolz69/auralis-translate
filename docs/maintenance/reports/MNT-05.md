# MNT-05: report assembly and verification

## Candidate and scope

- Repository: `auralis-translate`.
- Branch: `refactor/translate-report-tooling` in an isolated worktree.
- Recorded base: `8a35bfc59ba49c8e5a2e383e740424d49d49a6fc` (MNT-02 commands available).
- Tested source candidate: `082a9c7ec36b52e72202649a54b2e4d9b60541d5`.
- Tested source tree: `4234f4486eaa344627fdf0c18c92b3eec62c1668`.
- Review verdict: pending independent receiving review. This is a scoped internal move, not a release acceptance.

The current report assembler had 1,400 lines combining unrelated source, audio,
relation and comparison evidence. The two-page verifier had 945 sequential lines.
The main checker now owns the two-file publication boundary, reciprocal navigation
and dispatch. `verify-current-report.mjs` checks the focused current page;
`verify-historical-report.mjs` checks the retained measurements and failures.
The current assembler delegates pinned YouTube source/ASR, Vivo audio and source
relation evidence to focused loaders and ordered projections. The original
`loadCurrentReport(root)` signature and returned schema remain unchanged.

Changed source paths are `eval/scripts/current-report-data.mjs`,
`eval/scripts/check-public-demo-site.mjs`, `eval/scripts/youtube-source-report.mjs`,
`eval/scripts/vivo-audio-report.mjs`, `eval/scripts/source-relation-report.mjs`,
`eval/scripts/verify-current-report.mjs`, `eval/scripts/verify-historical-report.mjs`
and `eval/scripts/tests/report-tooling.test.mjs`. This report is the sole
documentation addition. No frozen evidence, historical input, model manifest,
Taskfile, generated site page or external site was committed.

## Behavior and field coverage

| Boundary | Base | Candidate / evidence |
| --- | --- | --- |
| Current fields | One loader validates pinned hashes, cross-report source/draft identities, failure states and release exclusions before returning ordered fields. | The same assertions remain in the owner loaders. The `official_reference`, `temporal_controls`, source/ASR, audio, relation, other model screens and backlog fields have the same names, values and order. Full `site/index.html` Git blob identity is unchanged. |
| Historical fields | One sequential checker compares retained report data with source loaders, raw measurements and failure evidence. | The moved historical verifier performs the same comparisons in the same order. Full `site/history.html` Git blob identity is unchanged. |
| Links, raw downloads and UI | Current/history navigation, section anchors, embedded JSON, retained raw download buttons, warnings and scripts. | `task site:check` verifies both pages. Local desktop and 390 × 844 mobile previews showed readable current and historical pages, with the history navigation wrapping at mobile width. |
| Missing/invalid evidence | Missing files fail reads; pinned report hashes fail assertions. | Four focused tests cover an absent report, an invalid report hash and raw markup in current model or historical source data. No missing evidence becomes a default success. |
| Privacy and escaping | Embedded JSON escapes `<`; the verifier excludes private paths/tokens and compiles page scripts. | The same privacy checks remain, with an explicit assertion that neither embedded JSON payload contains raw `<`. Synthetic unsafe strings are rejected. |

No public API, command name, protocol, configuration, schema, model profile,
retry, timeout or release decision changed. Assembly and verification use
retained local reports only; neither starts a model, acquires media or writes an
old report. The current/history split and failure retention remain explicit.

## Commits and review size

Counts are ordinary additions/deletions and rename-aware additions/deletions;
Git did not classify these partial moves as whole-file renames.

| Commit | Purpose | Ordinary +/− | Rename-aware +/− |
| --- | --- | ---: | ---: |
| `112d76d75bab3e62a69662d02cb25d7866ac780c` | Isolate current-page verification. | 486/478 | 486/478 |
| `f2f7d1e99363e3169aa9b6d2c9879792700feea6` | Isolate historical verification. | 461/453 | 461/453 |
| `96e2af4ef6e2cfd41a574105867e97009a929508` | Separate Vivo audio evidence and projection. | 175/158 | 175/158 |
| `2b372ee17e11c615816ad13c104121460217b626` | Separate YouTube source/ASR evidence and projection. | 158/141 | 158/141 |
| `932a67b6ce889c5dad0c248863b986ab8d0470ac` | Separate source relation evidence and projection. | 191/174 | 191/174 |
| `082a9c7ec36b52e72202649a54b2e4d9b60541d5` | Cover negative evidence and unsafe embedded markup. | 59/0 | 59/0 |

The aggregate source diff is 1,529 additions and 1,403 deletions across eight
files, mostly line-for-line moves. The current assembler is 939 lines; the
checker entrypoint is 19 lines, with focused verifier files of 485 and 459
lines. No generated-file churn is part of the commit series.

## Validation

All commands below ran from the isolated Translate worktree. Exit codes were 0
unless stated otherwise.

| Phase | Exact command | Result |
| --- | --- | --- |
| Base | `task site:build` | Rebuilt history (1,198,325 bytes) and current (120,342 bytes). |
| Base | `task site:check` | Both page boundaries, scripts and retained evidence passed. |
| Base | `task maintenance:test:report` | Seven experiment-record tests and both page checks passed. |
| Extraction | `task site:check` after each move | Passed after current verifier, historical verifier and each evidence projection. |
| Candidate | `node --test --test-isolation=none eval/scripts/tests/report-tooling.test.mjs` | Four focused negative/escaping tests passed. This direct run is temporary: the Taskfile owner will add the file to the MNT-02 report wrapper during integration. |
| Candidate | `task site:build` | Rebuilt both pages with Git blob hashes `d074bfa1d7564b204b525b42da0cb50f99fdbda3` (current) and `26c8e515d4b6861e0cbee36f11ecb07c4e1b6261` (history), identical to base and committed blobs. Embedded serialized data is therefore byte-identical as well. |
| Candidate | `task maintenance:test:report` | Seven existing record tests and both page checks passed. The wrapper does not yet invoke the new four-test file. |
| Candidate | `task site:check` | Both pages, retained evidence, privacy boundary and script checks passed. |
| Candidate | `task docs:check` | 561 Markdown files; local links valid. |
| Candidate | `task plan:check` | 59 canonical tasks, acyclic prerequisites and six document identities valid. |
| Report draft | `task docs:check`, `task plan:check` | 562 Markdown files and the same 59 canonical tasks verified after this report was added. |
| Report draft | `task maintenance:test:report`; direct `node --test --test-isolation=none eval/scripts/tests/report-tooling.test.mjs` | Existing wrapper and all four new negative/escaping tests passed after this report was added. |
| Preview | `task site:preview` | Current and historical pages visually inspected in Chrome at desktop and 390 × 844 mobile viewport, then preview stopped. No remote publication. |

The generated pages were restored in this worktree after comparing their Git
blob hashes. This removed only local rebuild line-ending differences. A first
commit-message attempt used a nonexistent local `.cache` subdirectory and failed
before creating a commit; the path was corrected, and no source change or
evidence was lost. No model/assets or personal application data were used.

## Limits and next action

MNT-02's `maintenance:test:report` wrapper does not yet include the new focused
test file. The coordinator owns the one-line Taskfile addition in Translate
integration and must rerun the wrapper on the combined committed candidate.
The receiving reviewer must inspect the full diff, compare the base and
candidate report fields and negative paths, and rerun focused checks before
recording `accepted`, `changes_requested` or `blocked_by_environment`.
Push status and final report commit identity are recorded in a follow-up
closure commit or integration record after they actually occur.
