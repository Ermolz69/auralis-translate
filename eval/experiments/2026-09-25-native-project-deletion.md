# Native project deletion during translation

Date: 25 September 2026. Platform: Windows desktop with the locally pinned checked llama.cpp runtime and Hy-MT2-1.8B Q4_K_M model. The input was a synthetic two-cue Chinese SRT, kept outside the Auralis managed project directory.

From the Auralis repository root, with absolute `AURALIS_TEST_LLAMA_SERVER` and `AURALIS_TEST_GGUF` paths set to those local assets, `task desktop:e2e:native:translation:delete` passed. Its initial sandboxed invocation was blocked when Windows denied execution of the bundled ffmpeg binary (`EPERM`); the accepted run used the normal isolated native E2E harness outside that sandbox.

The React scenario imported and finalized a managed copy of the source, froze a linked run in Auralis and Translate SQLite, started the checked model through the shared job runtime, and observed the Translate run in `running` state with unfinished blocks. It then called the ordinary project-deletion IPC command. The verifier waited for both the project-directory and Translate-cleanup outbox actions to reach `done`.

After deletion, Auralis had no project, translation link, publication, host job, or managed artifact for the deleted identity. Translate had a project-owned deletion tombstone but no translation or run rows for that identity. No pending, processing, or failed finalization remained for the deleted project; its managed directory was gone; the external input file still existed; and no newly launched model process survived. The baseline media/YouTube native workflow also completed in the same isolated desktop run. The harness removed its temporary data root.

This is one process-level cancellation and cleanup boundary for a running attempt. It does not exercise every possible timing interleaving, a checkpoint committed just before deletion, corrupted outbox payloads, or restoration from mismatched database backups. It does not assess Russian translation quality.
