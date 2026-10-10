# Native historical export probe plan, 10 October 2026

Identity: `HOST-03/INT-TR03-native-history-export-v1`. This is a model-backed
desktop integration probe, not a Chinese quality, G8 consumer, or clean-install
decision. The existing native history scenario is the control; the new opt-in
export mode adds IPC export checks without changing that control.

## Frozen inputs and budget

- One authored two-cue Chinese SRT (`你好。`, `再见。`) in the harness-owned fixture
  directory. The run produces a model result, a later second-cue correction,
  and a separate older-base first-cue branch. No natural corpus or holdout is
  used; no language score is permitted.
- Checked experimental Hy-MT2 1.8B Q4_K_M manifest: model SHA-256
  `dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699`,
  1,133,080,448 bytes; local `llama-server.exe` SHA-256
  `6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`,
  build `b10977-0ecb159c9`. The model, runtime, tokenizer, manifest and
  Auralis/Translate commit identities must be recorded again at execution.
- One native invocation. The harness allows at most 20 minutes to build the
  debug native application, 120 seconds for model startup, 600 seconds for
  translation completion, and 60 seconds for the reopened-history checkpoint.
  No repeated model answer is generated to obtain a preferred translation.
  A specific harness failure may be repaired once, retaining its failed output
  and using the same input/model budget.
- Before loading the model, inspect active model processes and GPU memory.
  Do not start if another managed model/server owns the machine. Run no other
  model-dependent task concurrently.

## Required observation and stopping rule

Through the actual React/Tauri command path, export the later and branched
historical results to new files outside Auralis data. Reopen the desktop,
retry the selected result to its original path after an uncertain response,
and export it to a second path. Independently compare every exported byte to
the verified managed artifact and digest, check that the original SRT and both
SQLite histories are unchanged, and confirm no test temp file survives. The
existing model checkpoints and explicit selection must survive restart.

Any wrong result identity, mismatched bytes, source mutation, extra inference,
partial file, stale selection, unreleased model child, timeout or cleanup
failure stops the probe and remains a failed record. The harness preserves its
owned sandbox on failure for audit. A pass supports this SRT native integration
slice only; WebVTT native export, real source-aware quality, consumer opening,
installed/offline workflow, G3–G5 and G9 remain separate gates.
