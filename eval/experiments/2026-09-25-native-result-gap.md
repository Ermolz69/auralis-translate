# Native Auralis recovery after Translate result commit

Date: 25 September 2026. This is S7 lifecycle evidence from a Windows native Tauri executable with the installed checked Hy-MT2 Q4_K_M model. It does not score translation quality or validate a release package.

## Injected boundary

The opt-in Auralis task `task desktop:e2e:native:translation:result-gap` builds with the `native-e2e` feature and uses an isolated application-data directory. A test-only hook writes the committed `run_id:result_id` to that directory and waits indefinitely **after** Translate commits a validated result and the Auralis host job closes, but **before** Auralis stages a publication. The normal build omits this hook. The harness verifies the durable boundary in both SQLite files and kills the desktop process. It then starts the same executable on the same isolated data directory without the hook.

Before termination, the harness observed a validated Translate run, its exact result row and two accepted block checkpoints. Auralis still held the active project run, had no selected result and no publication for that result ID, and had closed the completed host job association. The managed model child had exited before the desktop was killed.

On restart, Auralis reconciled the run and staged the missing publication. The outbox finalized a separate ready output artifact, then the project selected the same immutable result ID. The final verifier checked one Translate attempt and one host job, both retained checkpoints, matching result revision and source hashes across the databases, `needs_review`, unchanged managed original bytes, output digest, retained cue timings, and completed artifact-finalization messages. The task passed.

## Limits

The fixture is a synthetic two-cue Chinese SRT. The test kills the desktop at a deterministic pre-publication boundary. It does not cover every instruction boundary inside Auralis publication staging, concurrent desktop processes, manual edits during recovery, WebVTT inference, another OS, installation, or bilingual adequacy. Those checks retain their separate stage gates.
