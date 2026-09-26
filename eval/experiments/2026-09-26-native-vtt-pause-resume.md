# Native WebVTT pause and same-process resume

Date: 26 September 2026. Observed S4/S7 technical lifecycle evidence on the existing
Windows development machine. The synthetic strict-WebVTT path passes durable pause
and resume through React, Tauri, a managed checked model, both SQLite files and
ready artifact publication. Language and clean-machine gates remain open.
Work remains local; public publication is deferred by the owner.

## Command and inputs

From Auralis, `task desktop:e2e:native:translation:vtt:pause` exited 0 on its first
full invocation. It supplies the translation, WebVTT and pause flags to the shared
native runner, reusing the SRT pause verifier and frontend workflow. No product
Rust code, model prompt or production frontend behavior changed.

Absolute `AURALIS_TEST_LLAMA_SERVER` and `AURALIS_TEST_GGUF` pointed to the already
installed b10977-0ecb159c9 runtime and Hy-MT2 1.8B Q4_K_M model. The local CUDA
runtime directory was prepended to PATH; `AURALIS_NATIVE_E2E_MEDIA_READY=1` used
prepared media tools. No model/runtime/corpus download was performed. The test
requests 99 GPU layers, context 2048, one slot and the managed zero RAM cache.
These settings do not establish a minimum hardware or latency profile.

The fixture has two project-authored Chinese cues, CRLF, absent external cue IDs
and a protected `NOTE provenance` block. Its text is:

1. `你好。`
2. `我们先检查原来的字幕文件，再把需要翻译的文字取出来。翻译完成以后，程序会创建一个新的文件，保留原来的时间和顺序。如果中途停止，已经保存的部分不需要重新翻译。`

Initial source SHA-256:
`5cadd338ba5a75c0275142f3ba70db977bfaacf6469dbcac87fb4a2b3987f9e0`.
The native-only profile changes `target_segments_per_block` to one so the two cues
form two blocks; its stored fingerprint is
`ff338877b7db4d91427ac5c7bcf679439e4f91bd8e3afdbb102fa8dd77186761`.
The unchanged checked model SHA-256 is
`dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699`.
The production profile retains its existing settings.

## Observed lifecycle

React imports the file, waits for the managed original, freezes the run and starts
a managed host job. After one committed block it requests pause through Tauri.
Acknowledgment has state `paused`, a cleared pause flag and one saved checkpoint.
The first Translate attempt closes with reason `pause requested`; the host job
closes as cancelled. The project keeps its active run and has no selected output.

At a test-only project-title barrier, the outer harness requires zero results,
zero publications and zero translated artifacts of any state. It also requires
no new managed model process remaining. It releases the same desktop to resume
the same run with a second host job and Translate attempt.

| Observed identity             | Value                                  |
| ----------------------------- | -------------------------------------- |
| Run ID                        | `23f03690-28ec-4003-b23e-686cba1a3bb4` |
| Cancelled first job           | `7f0202ad-464d-4b36-85cc-fe8fb47f72ee` |
| Completed resumed job         | `237da8e2-43f3-48af-902e-b2fcd4202686` |
| Closed Translate attempts     | 2, with distinct matching host IDs     |
| Translated artifacts at pause | 0                                      |
| Retained first checkpoint     | Every database field identical         |

Final checks require both checkpoints, a validated `needs_review` result, matching
result/revision across the databases and a ready separate artifact whose digest
matches Translate's output hash. The original has another ID/path; its bytes match
the external file, stored source hashes and initial digest. The output retains
the protected header/NOTE prefix, both timing lines and CRLF. Both source/output
outbox finalizations are acknowledged. React also reads the selected comparison
and verifies its source/result mapping and nonempty translated lines.

The runner emitted the run/job record above with `checkpoint_retained: true`,
`closed_attempts: 2` and `partial_output_artifacts_at_pause: 0`, followed by its
success message. It removed the native application-data sandbox and test frontend
build. Generated subtitle files, databases and weights were not added to Git.

## Supporting checks and limits

`task q:translation-delivery` passed eight exclusion/publication policy tests.
`task docs:check` and `git diff --check` passed in Auralis and Translate after
documentation updates. The current application package was not rebuilt for this
test-only tooling slice; its exact prior MSI identity remains in the delivery record.

Debug model admission and repeated file verification took noticeable time while
the processes remained alive; no startup/stop latency gate was measured. This
native pause occurs after a checkpoint without sampling an active HTTP slot.
The [real CLI request-pause record](2026-09-26-request-cancellation.md) separately
observes busy checked-model inference. This closes the named native WebVTT
pause/resume scenario only. Concurrent start/pause/resume/deletion, pre-attempt
admission cancellation, varied format/player fixtures, clean Windows installation
and bilingual subtitle evaluation remain separate gates.
