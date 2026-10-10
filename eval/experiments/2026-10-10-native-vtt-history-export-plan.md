# Native historical strict WebVTT export probe plan, 10 October 2026

Identity: `HOST-03/INT-TR03-native-vtt-history-export-v1`. This is a separate
model-backed native integration probe following the passed
[SRT probe](2026-10-10-native-history-export-result.md), not a language or
clean-install score.

## Frozen input, candidate and budget

- One authored two-cue Chinese strict plain WebVTT fixture with CRLF,
  `WEBVTT`, `NOTE provenance` and the cue texts `你好。`, `再见。`. There is no
  natural corpus, holdout, independent reference or quality score.
- Auralis native history/export scenario with a Translate submodule pinned to
  `1b888d0b7eb78a67794445fcbc51eb06329f9b64`. The exact Auralis code
  commit and clean/dirty state must be recorded before model admission. The
  checked experimental Hy-MT2 1.8B Q4_K_M GGUF SHA-256 is
  `dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699`;
  local `llama-server.exe` SHA-256 is
  `6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`,
  build `10977`, commit `0ecb159c9`. Check the model manifest and runtime
  again before running.
- One `task desktop:e2e:native:translation:history:export:vtt` invocation.
  Allow at most 20 minutes for native build, 120 seconds for model startup,
  600 seconds for translation completion and 60 seconds for reopened history.
  Do not repeat model generation for a preferred output. If a harness defect
  prevents observation, retain the failure and permit at most one repaired run
  using this same fixture and model.
- Inspect model processes and GPU memory before admission; start no concurrent
  model task. Retain failed sandboxes and diagnostics. The harness owns and
  removes its sandbox only on success.

## Required observation and stopping rule

Use the actual React/Tauri path to create the model result, edit the second
cue, branch the first cue from the older base and select the historical result.
Export two historical `.vtt` revisions via IPC, restart the desktop, retry the
selected result to its existing path and re-export it to a fresh path. Independently
compare every byte and digest to the managed artifact, including `WEBVTT`,
`NOTE`, CRLF, cue times and order. Confirm the original is unchanged, both
SQLite histories and model checkpoints survive, only one inference attempt
occurred, no review approval was created, no temp file remains and the model
child exits.

Any wrong format/identity, changed protected byte, mismatched export,
unexpected mutation or inference, leftover child or file, timeout or cleanup
failure stops this probe as failed. A pass supports this authored WebVTT native
slice only. Target-consumer G8, installed/offline G9, natural source-aware
quality and independent G3–G5 review remain separate gates.
