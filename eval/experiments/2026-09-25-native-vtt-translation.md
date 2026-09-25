# Native Tauri strict-WebVTT checked-model acceptance

Date: 25 September 2026. This is a native Windows end-to-end result for one synthetic Chinese cue in the documented plain-WebVTT subset. It proves this named path ran; it does not establish broad WebVTT support, subtitle language quality, interrupted WebVTT recovery, a clean installation, or a release gate.

## Setup and command

The Auralis checkout used `task desktop:e2e:native:translation:vtt` with absolute `AURALIS_TEST_LLAMA_SERVER` and `AURALIS_TEST_GGUF` paths pointing to the already installed, untracked llama.cpp b10977 executable and Hy-MT2-1.8B-Q4_K_M GGUF. The checked experimental profile pins the model size and SHA-256 and requires the expected runtime build and 2048-token context. The harness creates a temporary application-data root and its own `translation-runtime.json`; it does not install a model. The local test machine is the Windows/RTX 3070 setup described in the [SRT native record](2026-09-25-native-tauri-translation.md). This run did not measure peak RAM/VRAM or end-to-end speed as a benchmark.

The source is a synthetic `.vtt` with `WEBVTT`, CRLF separators, a protected `NOTE provenance` block, one cue without an external ID, one Chinese text line, and a terminal CRLF. The native React scenario imports this source into a project, begins a project-linked Chinese→Russian run, starts the managed model worker through Tauri IPC, waits for a ready selection, and reads the comparison. The harness then inspects both SQLite files and both managed artifacts, matching project/run/result revisions and host job completion. It checks that the external and managed originals match the stored source hashes; the separate output matches Translate's committed digest and retains the exact header, comment, timing, CRLF prefix, and terminal CRLF.

## Observed result

The command exited 0 and printed `Native Tauri WebVTT E2E passed: checked local translation preserved the separate source, protected spans, and both databases; sandbox cleaned.` The frontend and native Tauri build completed, the checked local model completed the run, and the isolated test directory was removed. This mode terminates the desktop during cleanup but does not independently assert the model child's PID after shutdown. The output had a nonempty translated comparison line and differed from the Chinese source; no bilingual reviewer assessed its language or adequacy.

The earlier [mock two-database test](2026-09-25-auralis-vtt-two-db.md) covers the same format through application use cases. This native run additionally covers the React/Tauri route and managed checked model for one cue. It leaves wider format fixtures, multi-cue real-model WebVTT interruption/resume, target-player export, license-cleared language holdouts, and S8/S9 gates open.
