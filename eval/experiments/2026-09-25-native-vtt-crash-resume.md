# Native strict-WebVTT checked-model crash and resume

Date: 25 September 2026. This is one native Windows crash boundary for the documented plain-WebVTT subset. It verifies durable block recovery through Auralis and Translate; it does not establish language quality, arbitrary WebVTT support, a long-file SLA, a clean model installation, or the full S8 gate.

## Setup and injection

From the Auralis checkout, `task desktop:e2e:native:translation:vtt:crash` ran with absolute `AURALIS_TEST_LLAMA_SERVER` and `AURALIS_TEST_GGUF` paths to the already installed checked llama.cpp b10977 runtime and Hy-MT2-1.8B-Q4_K_M model. The harness created an isolated temporary application-data root, built the React/Tauri desktop, and generated a synthetic two-cue `.vtt` source with CRLF, a protected `NOTE` block, no external cue IDs, and Chinese text. The model was invoked through the managed host job, not a separately started test server.

After exactly one committed Translate block, the harness captured its input fingerprint, accepted JSON and commit timestamp, then terminated the desktop process. It verified that the managed model child exited and that the active project link still named the same run and retained its first checkpoint. On the restarted desktop, startup recovery closed the interrupted host attempt and the React scenario resumed the same run. The result was structurally validated and published as a separate ready Auralis artifact.

## Observed checks

The task exited 0 and printed `Native Tauri WebVTT crash E2E passed: first checkpoint survived desktop termination and the resumed run published a separate copy; sandbox cleaned.` The verifier observed two committed blocks, two Translate attempts and two Auralis translation jobs. It compared the first block's fingerprint, accepted JSON and commit timestamp with the pre-crash snapshot, so resume did not replace that checkpoint. Both databases agreed on the selected result and revision; the final artifact hash matched Translate's result digest. The external and managed originals matched their stored source hashes. The separate output retained the `WEBVTT` header, `NOTE`, both timing lines and CRLF.

This complements the [one-cue native completion](2026-09-25-native-vtt-translation.md) and [mock two-database application test](2026-09-25-auralis-vtt-two-db.md). The evidence covers one two-cue process-kill timing on one installed model and machine. A separate standalone CLI real-model interruption run, wider format fixtures, target-player export, bilingual holdouts and model installation remain open.
