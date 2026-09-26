# Ready result history and explicit selection

Date: 26 September 2026. Local implementation and verification record.
The named native edit/selection/reopen scenario passes. This record does not close
S7 as a whole or the language/release gates.

## Implemented behavior

The [history contract](../../docs/architecture/014-result-history-selection.md)
adds project-scoped ready publication pages and explicit historical selection to
Auralis. History contains metadata only. Result content remains in Translate
SQLite; selecting a version never modifies either output file or the original.

The new application operation inspects the immutable source against the historical
frozen run, reconstructs the result, checks publication metadata, and hashes the
existing managed output before the host write transaction. That transaction
rechecks ownership, source/readiness, expected link revision and current pending
publication. It preserves an unfinished active run. Automatic publication keeps
its separate precedence guard. Concurrent writes cannot silently replace a user
choice or strand a staged publication at a new link revision.

The real review panel displays history separately from its current attachment.
Preview only loads comparison. The explicit attachment button sends the observed
link revision. Historical versions remain readable without offering a known stale
edit; branching an edit from an older base remains separate work.

## Supporting checks

Commands run in the Auralis checkout:

| Command                                                                                                                                                         | Observed result                                                                                                                                                                                                                                                                          |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `task rust:test:storage -- --test translation_history`                                                                                                          | Six tests pass against real SQLite: bounded cursor pages/new insertions, stale/foreign choices, artifact readiness/source/ownership, idempotence, active-run preservation, pending-publication ordering and concurrent writers.                                                          |
| `task rust:test:application -- --test translation_publish`                                                                                                      | One extended two-database scenario passes real Translate result/edit/reconstruction and Auralis publication. Corrupt/missing source or output is rejected before host mutation. Fresh database connections and recovery retain historical selection. The provider is a loopback fixture. |
| `task rust:test:storage -- --test staging_digest`                                                                                                               | Same-size corruption regression passes after the port rename.                                                                                                                                                                                                                            |
| `task fe:test:components -- src/features/translation-review/ui/TranslationReview.test.tsx src/features/translation-review/ui/TranslationSegmentEditor.test.tsx` | Eight component tests pass, including preview versus attachment, cursor history, optimistic conflict, obsolete reads after project change, and retained edit/publication retry behavior.                                                                                                 |
| `task fe:test:unit -- src/shared/api/contracts/translationHistoryValidation.test.ts src/entities/translation/api/translationHistory.test.ts`                    | Five tests pass: bounded validated payloads, duplicate/revision/cursor rejection, scoped responses and request identity.                                                                                                                                                                 |
| `task fe:typecheck`, `task fe:lint`                                                                                                                             | Pass.                                                                                                                                                                                                                                                                                    |
| `task quality:fsd-boundaries`, `task quality:ipc-contract`, `task quality:file-size`, `task quality:duplicate-code`                                             | Pass after matching Rust `Option` cursor optionality in the TypeScript map.                                                                                                                                                                                                              |
| `task rust:clippy`, `task rust:clippy:native-e2e`, `task rust:fmt`                                                                                              | Final reruns pass with denied warnings and checked formatting.                                                                                                                                                                                                                           |
| `task fe:build`                                                                                                                                                 | Pass. Delivery check examines sixteen frontend files and excludes emitted native tests, weights and evaluation payloads.                                                                                                                                                                 |
| `task docs:check` in Translate / Auralis                                                                                                                        | Pass: 77 active Markdown files in Translate; five checker tests and 31 host files.                                                                                                                                                                                                       |

The first non-elevated component invocation could not spawn Vite helper processes;
the exact task passed with local build access. Initial component failures were
ambiguous warning-label queries and an untyped fixture error; the corrected test
uses the paragraph label and a typed conflict. The first reopen assertion expected
zero reconciliation items, but the existing API returns one successful item per
recoverable link; the corrected assertion checks that item and the unchanged
selected result. These fixes do not relax product invariants.

## Native gate

`task desktop:e2e:native:translation:history` completed with exit 0 on the local
Windows/CUDA bench using the checked Hy-MT2 Q4 profile and an authored one-cue SRT.
The actual React editor saved `Привет, мир.` to a separate ready revision. The
history dropdown previewed the original model result while the project still
pointed to the edit; the explicit selection button then attached the model result.
After terminating and reopening Auralis on the same isolated data root, the actual
review panel rendered the old attachment and withheld a stale edit control.

The external verifier checked both real databases, source/output ownership,
ready states, result IDs/revisions, managed output sizes and hashes, source bytes,
preserved timing, and acknowledged finalization of the original plus both outputs.
Only one model attempt exists. The before/after-restart snapshot has the same
selected result, link revision and both immutable output identities/digests.

| Observation                          | Value                                                              |
| ------------------------------------ | ------------------------------------------------------------------ |
| Translation                          | `d7f87e02-a2ca-4eba-90ce-c752335f70af`                             |
| Model run                            | `a54dc265-449e-44a1-864c-8ccedf66c44a`                             |
| Selected model result, revision 1    | `34dc1ccd-486d-43e3-be86-1343cbd7bfa5`                             |
| Model artifact                       | `a48d0003-607c-49d4-9010-d737c0d44607`                             |
| Model output SHA-256                 | `e1bd07b25695411ec29cc5a55813e3c0e7094de94cebf8c3e528682127325cf3` |
| Manual result, revision 2            | `5073759d-e947-449f-95f8-a74b814a79ff`                             |
| Manual artifact                      | `ce63f24a-e4af-4218-840c-dc6066a35d6f`                             |
| Manual output SHA-256                | `9ecc4b335c661a1d5f82de41b99763acd726bcd50f15d819293133c35a4f269d` |
| Link revision before/after reopening | `4` / `4`                                                          |
| Active run before/after reopening    | absent / absent                                                    |

Markers occur in order: `translation-history-manual-ready`,
`translation-history-preview`, `translation-history-selected`,
`translation-history-reopened`. The harness removed its sandbox
`auralis-native-e2e-JUNQv9` and `dist-native-e2e`; both absences were independently
checked after terminal completion. Model weights were existing separately acquired
assets; this invocation performed no download or public publication.

## Remaining limits

Older-base branch edits, broader review/diagnostic interaction, extra command
interleavings and actual Windows cleanup failure remain open. This authored
one-cue input does not validate representative subtitle quality, Japanese support,
player compatibility, hardware SLAs or clean Windows installation. No production
model/profile winner is selected. Public publication remains deferred by the
owner; all development is local and model weights stay outside Git/releases.
