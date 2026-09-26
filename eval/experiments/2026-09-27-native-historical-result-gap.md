# Native historical core commit interruption protocol

Date: 27 September 2026. Status: actual native task passed with exit 0. This extends
[completed historical save/reopening](2026-09-27-native-historical-branch.md).
Development and commits remain local; public publication is deferred.

## Boundary and expected recovery

Run `task desktop:e2e:native:translation:history:result-gap` from Auralis with the
existing separately supplied checked model/runtime paths. The native-only profile
uses the authored two-cue SRT and two model checkpoints from the history probe.
Actual React controls create a later second-cue edit, then edit the first cue from
the older original model result. Only this explicit older-base branch is held
after its Translate transaction commits and before the save IPC returns. At that
boundary the metadata-only host intent and core result/provenance are durable,
but the branch has no Auralis publication or translated artifact.

While the save is held, actual history controls explicitly attach the original
model version. The external harness requires that choice to commit before killing
the native desktop. It reads both real SQLite files and existing managed files,
independently recomputes both edit request digests, and records exact checkpoints,
attempts, edit ancestry and selected link. It verifies the same snapshot after
termination, then launches the desktop without the hold environment variable.

Production startup must find the admitted committed branch independently of the
current selection, verify its request/ancestry and publish a separate ready file.
Since the project link changed after the admitted save, recovery must retain that
branch in history without attaching it. Actual reopened comparison shows the
original model version; previewing the recovered branch preserves its untouched
model second cue and does not alter attachment. The external oracle requires all
three immutable output hashes and protected bytes, two journal rows, one inference
attempt, two unchanged checkpoints and the same explicit choice/link revision.

```mermaid
sequenceDiagram
    participant UI as Actual review controls
    participant H as Auralis SQLite
    participant T as Translate SQLite
    participant R as Native harness / restart
    UI->>H: Admit metadata-only branch intent at link revision 3
    H->>T: Commit older-base revision 3 and provenance
    T-->>UI: Test-only hold before save response
    UI->>H: Explicitly choose original revision 1; link revision 4
    R->>R: Verify committed snapshot; kill desktop
    R->>H: Reopen through production startup recovery
    H->>T: Verify committed branch and request digest
    H->>H: Publish ready branch as history; preserve link revision 4
    UI->>H: Preview recovered branch without attachment
```

The hold and marker reader are gated by the Rust `native-e2e` feature. The marker
contains only run/result IDs; no original or translated text is duplicated in
host storage. Normal desktop builds cannot activate the hold and return unavailable
for the test observer. Native frontend fixtures remain outside production delivery.
No model/corpus data or public upload is introduced.

## Observed result

The task passed on its first actual invocation. The harness killed the live native
desktop after the branch core commit and the later explicit UI choice. The branch
had no publication at that boundary. After restart, production recovery published
its ready output in history while retaining the original selected result at link
revision 4. Actual reopened controls displayed the model result and previewed the
recovered branch without changing attachment.

| Observation                               | Value                                                              |
| ----------------------------------------- | ------------------------------------------------------------------ |
| Translation                               | `842e7f35-bab0-4abd-a1f9-ee18a19aad50`                             |
| Run                                       | `0e30cc05-c4df-476e-9a20-9900034016fd`                             |
| Model result, revision 1, selected        | `541d7187-f28e-41f5-9214-c97b113861d0`                             |
| Later second-cue edit, revision 2         | `18b660f7-7929-4ab5-844d-483aedb60d11`                             |
| Interrupted older-base branch, revision 3 | `32c3a4e3-31b4-4180-9e9d-0d4f095aabeb`                             |
| Source SHA-256                            | `e19dd2556c91b7a20f5bdcfe3777404a19501a884ed3e048bbce3d50944e0ead` |
| Model output SHA-256                      | `8646bcb2f3e1d0feffdd8df43cb83a5cc2e9aa12ba976a36ec50b995de60107e` |
| Revision 2 output SHA-256                 | `429f38bbdf7ec7573fae9d232eec5755e731f21dcb12706ad570636420c9852a` |
| Recovered revision 3 output SHA-256       | `94a450a310da9191d7bd8b234469332b5345cf978eaca5eaa2c9f819688b2f20` |
| Revision 2 request digest                 | `f9fff94aab90ed4a23243af162f077b3f283d9f4763045851a7bac86a671a441` |
| Revision 3 request digest                 | `64a6bd6c65f9136066932af1ef8e2a25ff7d64b890ae4bf58d2c74738deb4a49` |
| Link revision before/after recovery       | `4` / `4`                                                          |
| Publications before/after recovery        | `2` / `3`, all ready                                               |
| Model attempts before/after recovery      | `1` / `1`                                                          |
| Committed blocks before/after recovery    | `2` / `2`                                                          |

The external snapshots matched across termination and recovery: the complete link,
all three core result records, both edit intents/digests and ancestry, selected edit
sets, checkpoint payloads/fingerprints/diagnostics/commit times, the completed model
attempt and host job, and all three previously existing source/output file hashes.
Independent final output checks verified the recovered branch's protected bytes,
first-cue edit and untouched model second cue. Both host digests matched the
versioned length-prefixed canonical request hash. The original and all three
outputs had acknowledged finalization outbox records.

The model returned `Здравствуйте.` and `До свидания.` for authored `你好。` and
`再见。`. These match the authored equivalents in the preceding history record.
The manual marker lines are deliberate edits, not translation references. This
small authored comparison has no bilingual representative-quality verdict.

The separately supplied checked assets were unchanged: Hy-MT2-1.8B Q4_K_M,
upstream `a0c709d9fac510f2c807aa3af52872340dc37a4a`, 1,133,080,448 bytes,
SHA-256 `dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699`,
runtime `b10977-0ecb159c9`, 2048 context tokens and 99 requested GPU layers on the
development Windows machine. The managed model was absent before the injected
desktop kill and at final verification. No model download or clean-machine claim
is made.

## Checks and cleanup

- `task desktop:e2e:native:translation:history:result-gap`: exit 0; committed
  boundary, explicit newer choice, forced termination, actual restart and ready
  historical recovery verified.
- `task rust:test:application -- --test translation_historical_edits --test translation_publish --test translation_publication_recovery`:
  10 passed with real persistence and deterministic providers.
- `task frontend:test:components -- src/features/translation-review`: 18 passed.
- `task rust:fmt-write`, `task rust:clippy:native-e2e`, `task rust:clippy`: passed.
- `task frontend:typecheck`, `task frontend:lint`: passed.
- `task quality:ipc-contract`: five checker tests and IPC parity passed. Its first
  sandbox invocation hit `spawn EPERM`; the permitted local retry passed.
- `task quality:file-size`: eight checker tests and module limits passed.
- `task quality:fsd-boundaries`: six configuration tests, ESLint and internal
  import checks passed.
- Translate `task docs:check`: 84 Markdown files validated. Host `task docs:check`:
  five checker tests, 31 Markdown files and 11 mandatory documents passed.
  External links and anchors are outside these checks.
- `task frontend:build`: production budgets and translation delivery passed;
  16 frontend files contained no emitted native tests, weights or test data.
  Initial JS 321.43 KiB, total JS 372.17 KiB, initial gzip 99.62 KiB.

The harness cleaned `auralis-native-e2e-JMJljA` and `apps/desktop/dist-native-e2e`;
their absences and absence of remaining desktop/model processes were independently
checked after completion. Existing separately acquired runtime/weights remained.

## Limits

This boundary does not test termination after journal admission but before core
commit, interrupted staged-file/outbox finalization, another live unfinished model
run, all simultaneous commands, power loss, language quality or clean installation.
Those remain separate gates despite this named probe passing.
