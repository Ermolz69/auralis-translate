# Native checked-model historical branch and reopening

Date: 27 September 2026. The completed-save/native reopening probe passed with
exit 0 on its final invocation. The supporting prerequisites are in
[the desktop contract record](2026-09-26-historical-edit-desktop-contract.md).
Development and commits remain local; public publication is deferred.

## Scope and oracle

`task desktop:e2e:native:translation:history` now generates an authored two-cue
plain UTF-8 SRT with `你好。` and `再见。`, separate managed source/output files and
an isolated application-data root. It runs the actual React/Tauri commands and
the separately supplied checked Hy-MT2 model. The native-only frozen profile
uses one source segment per model block, so two durable checkpoints are expected
within one inference attempt. The production profile is not changed.

The actual controls first correct the second cue to
`Поздняя правка второй реплики.`. They then preview the original model result
without changing the project's selected version, and correct its first cue to
`Правка первой реплики из исходной версии.`. This explicit older-base branch must
retain the original model translation of the second cue. It must not inherit the
later correction.

The panel previews the branch, then explicitly chooses the second result. The
branch notice must become ready history while the project points to the second
result. After terminating and reopening the desktop on the same isolated data,
the selected comparison must remain unchanged and its historical editor must
observe the third result as the newer run head before enabling save.

The external verifier reads both actual SQLite files and every ready managed
output. It checks all protected SRT bytes, output hashes/sizes/ownership/review
states, per-run revisions 1/2/3, both metadata-only edit intents and independently
computed request digests, persisted base/head/segment ancestry and selected
manual edit sets. The third result must contain only its first-segment edit.
Before/after reopening snapshots include output identities, journal/provenance,
selection/link revision and original committed model checkpoints. No additional
inference attempt is allowed. The completed managed model child must be absent.

This is a completed-save/reopening probe. It does not kill the desktop between
journal admission, core commit and file publication; those interruption gates
remain separate work. The source and manual lines are authored test data and the
native scenario is excluded from the production frontend.

## Model boundary

- Model: `tencent/Hy-MT2-1.8B-GGUF`, upstream revision
  `a0c709d9fac510f2c807aa3af52872340dc37a4a`, Q4_K_M.
- Declared file bytes: `1133080448`; SHA-256:
  `dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699`.
- Checked runtime build: `b10977-0ecb159c9`; minimum context: 2048 tokens.
- Test runtime configuration: Windows, 2048 context tokens, 99 requested GPU
  layers, existing local runtime/model paths supplied by environment variables.
- No model download, model embedding, corpus acquisition or public upload occurs.

## Result

The final `task desktop:e2e:native:translation:history` completed with exit 0.
It verified all three separate outputs, explicit choice of revision 2, the ready
historical notice for revision 3, and the same selection/metadata/files after a
real desktop termination and reopening. The managed model was absent before
restart. One inference attempt and both original checkpoints remained unchanged.

| Observation                                 | Value                                                              |
| ------------------------------------------- | ------------------------------------------------------------------ |
| Translation                                 | `783ef1cd-19af-49e8-ba4b-e7f13da0e2ed`                             |
| Run                                         | `82d2937e-ffb9-4230-a864-ddab6c4a51ec`                             |
| Model result, revision 1                    | `ba409359-d056-4d98-bb31-b943acb99c01`                             |
| Later second-cue edit, revision 2, selected | `6e8b3cae-f60b-4d35-9dc4-214f874b37ac`                             |
| Older-base first-cue branch, revision 3     | `98b8ee02-c1d7-4dba-a367-fe4a8901812f`                             |
| Model output SHA-256                        | `8646bcb2f3e1d0feffdd8df43cb83a5cc2e9aa12ba976a36ec50b995de60107e` |
| Revision 2 output SHA-256                   | `429f38bbdf7ec7573fae9d232eec5755e731f21dcb12706ad570636420c9852a` |
| Revision 3 output SHA-256                   | `94a450a310da9191d7bd8b234469332b5345cf978eaca5eaa2c9f819688b2f20` |
| Revision 2 request digest                   | `83c78dc1df3cba122a8d99f5aefe37978ca3aedd921f922440f0eb6851a14b57` |
| Revision 3 request digest                   | `ce20683ccb10d15b897cfc9d90f8fa3310f0a518c49f486c9a208104da9df89a` |
| Link revision before/after restart          | `5` / `5`                                                          |
| Inference attempts before/after restart     | `1` / `1`                                                          |
| Committed model blocks before/after restart | `2` / `2`                                                          |

The second-cue edit records base/head revision 1 and host observation 2. The
first-cue branch records base revision 1, head revision 2 and host observation 3.
Their persisted manual selection sets contain only segment 2 and segment 1,
respectively. Independent request hashing matched both host journal digests.

### Authored reference comparison

| Source   | Authored Russian reference/equivalent | Actual model line | Revision 2                       | Revision 3                                  |
| -------- | ------------------------------------- | ----------------- | -------------------------------- | ------------------------------------------- |
| `你好。` | `Здравствуйте.` / `Привет.`           | `Здравствуйте.`   | `Здравствуйте.`                  | `Правка первой реплики из исходной версии.` |
| `再见。` | `До свидания.`                        | `До свидания.`    | `Поздняя правка второй реплики.` | `До свидания.`                              |

Both model lines match an authored reference here. This is an unreviewed two-cue
comparison, not representative subtitle adequacy, a production profile verdict
or a Japanese gate. The manual strings are deliberate oracle markers rather than
translations of their source sentences.

The first native invocation
completed model translation and the second-cue edit, then exposed a comparison
bug: choosing the already displayed preview cleared its page without changing a
fetch dependency. A separate component test failed before the fix. Preview now
keeps a valid page when neither its result nor offset changes; choosing a new
result or returning from a later page still clears and reloads it. All 18 review
component tests subsequently passed, including the new regression. The native
scenario then passed from a fresh isolated root.

The test runner's failure checkpoint also exceeded its existing UTF-8 length or
line boundary. It now removes CR/LF and retains at most 80 UTF-16 units after its
ASCII prefix, satisfying the unchanged 256-byte checkpoint limit. Diagnostic
admission was not widened.

Static frontend typechecking
and lint, Rust formatting and `task rust:clippy:native-e2e` have passed. An initial
driver constructor used a TypeScript parameter property forbidden by this
checkout's `erasableSyntaxOnly`; it now has an explicit field and assignment.

`task frontend:build` passed the production bundle budget and translation delivery
check: 16 frontend files, no emitted native test modules, model weights or test
data. Native fixture assets are generated only in the isolated test root.

## Checks and cleanup

- `task desktop:e2e:native:translation:history`: final exit 0, ordered markers
  `translation-history-manual-ready`, `translation-history-preview`,
  `translation-history-branch-ready`, `translation-history-selected`,
  `translation-history-reopened`; external snapshots were identical.
- `task frontend:test:components -- src/features/translation-review`: 18 passed.
  The focused `-t 'same preview'` regression failed before the production fix.
- `task frontend:typecheck`, `task frontend:lint`: passed. Native and production
  builds also ran the frontend typecheck.
- `task rust:fmt-write`, `task rust:clippy:native-e2e`: passed.
- `task quality:fsd-boundaries`: six configuration tests, frontend ESLint and
  internal import-checker tests passed.
- `task quality:file-size`: eight checker tests and all module limits passed.
- `task quality:ipc-contract`: five checker tests and command/event parity passed.
- Translate `task docs:check`: 83 Markdown files validated. Host `task docs:check`:
  five checker tests, 31 Markdown files and 11 mandatory documents passed. The
  initial host invocation hit sandbox `spawn EPERM`; the permitted local retry
  passed. External links and anchors are outside these checks.
- `task frontend:build`: final production build passed; initial JS 321.39 KiB,
  total JS 372.13 KiB, initial gzip 99.62 KiB. Translation delivery found no
  emitted test modules, weights or test data in the 16 checked frontend files.

The harness cleaned the failed sandbox `auralis-native-e2e-qynQpx`, the successful
sandbox `auralis-native-e2e-0k1TQR` and `apps/desktop/dist-native-e2e`. Their absences
were independently checked after terminal completion. Existing separately
acquired weights/runtime assets were retained.

Chinese/Japanese subtitle quality, broader syntax/resource/player coverage,
native manual-save crash boundaries, command interleavings and clean Windows
installation remain open. A two-cue authored probe cannot close those gates.

The subsequent [native core interruption record](2026-09-27-native-historical-result-gap.md)
passes one manual-save process-kill boundary with a newer explicit choice preserved.
Journal-only and staged publication interruption remain separate requirements.
