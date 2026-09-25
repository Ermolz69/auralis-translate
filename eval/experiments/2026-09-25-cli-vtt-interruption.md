# Standalone strict-WebVTT CLI interruption and resume

Date: 25 September 2026. This is one opt-in Windows acceptance run with a checked local model. It establishes a narrow standalone CLI crash and resume boundary, not subtitle language quality or general WebVTT support.

## Setup

`task eval:cli:vtt:interruption` built the Translate workspace and ran the [repeatable harness](../scripts/cli-vtt-interruption.mjs) with absolute `AURALIS_TEST_LLAMA_SERVER` and `AURALIS_TEST_GGUF` paths to the locally cached llama.cpp b10977 server and Hy-MT2-1.8B-Q4_K_M GGUF. The harness started its own loopback server, waited for `/health`, and used the checked experimental profile with one target cue per block. The profile preflight verifies the server alias, build, context size, and model file digest before an attempt.

The isolated fixture had three Chinese text cues, CRLF separators, no external cue IDs, and a protected `NOTE` block. Its source, managed copy, SQLite state and eventual output lived under one fresh temporary test directory. The harness removed that directory only after every assertion passed.

## Injected interruption and observations

After the CLI reported `saved_blocks=1/3`, the harness terminated that CLI process while leaving the model server running. It reopened Translate SQLite and observed run `8c90512f-38f1-490c-9c63-b2b289a1b498` in `running` state, exactly one committed checkpoint, one open attempt, no result, and no output file. The external and CLI-managed originals still matched the fixture digest.

`resume` used the same run ID and profile. The task exited 0 with `Standalone WebVTT CLI interruption E2E passed: run 8c90512f-38f1-490c-9c63-b2b289a1b498 kept its first checkpoint, resumed two missing blocks, and wrote a separate verified copy.` The verifier found a validated run, three checkpoints, two closed attempts, unchanged first-checkpoint fingerprint/payload/commit timestamp, and a `needs_review` result. The new output hash matched the stored result digest; the original and managed source hashes were unchanged. Header, `NOTE`, all timing lines and CRLF remained in the separate WebVTT file.

This complements the [mock CLI recovery test](../../crates/auralis-translation-cli/tests/cli_resume.rs) and [native Auralis desktop crash test](2026-09-25-native-vtt-crash-resume.md). It covers one three-cue process-kill timing on one installed model and machine. It does not exercise a restarted model server, CLI exit/report stability, long files, target-player export, model installation or bilingual quality review.
