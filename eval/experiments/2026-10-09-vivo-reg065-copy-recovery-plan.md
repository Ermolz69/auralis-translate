# REG-065 copy-only recovery plan

Date: 9 October 2026. Freeze this plan, its Taskfile entry and harness before
the next model call. Parent evidence is the original Vivo v8 long-file run
recorded in `2026-10-09-vivo-original-v8-long-result.md`. The original
1.8B state stopped after 28 of 117 four-cue batches; the separate 7B arm
completed 467 cues but has source-aware semantic faults.

## Identity and objective

- Source: original-platform Vivo `zh-CN` SRT, 467 cues, SHA-256
  `b100803367b95fa55fc638b1ff39a0abfa0d5b8183ebe58d58b1a87242d9d8c4`.
- Input state: `attempt-MAaX5T/1_8b/state` under the private original-run
  directory. Its SQLite SHA-256 before copying is
  `9b631a1edf5e9e3fa6e1b660a35c414d8b34b2f35f522ea2def4a8d4705666b1`.
  Original run ID: `fbcd29fb-b556-490c-b956-2b91d37a3edd`.
- Fixed model: Hy-MT2 1.8B Q4_K_M SHA-256
  `dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699`.
  V8 batch-four manifest SHA-256
  `1803aeb68428e1b138a17ed72b01abe1cc5fbc5845b5bca66a402b8936b1081f`.
- Fixed runtime: llama-server SHA-256
  `6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`.
  New REG-065 CLI SHA-256
  `0a5620b6f2b733dafe5a6d5c58771a6bfffc8f6f2069d01ce8d93d66ab04213f`.
- Hypothesis: provider-side terminal CR/LF normalization lets a fresh resume
  pass batch 29 without changing the version-hashed v8 prompt. Continue to
  the end only if model replies validate. Preserve every raw reply and every
  durable checkpoint. Never alter the original run or 7B arm.

## Bounds and decisions

One copy, one 1.8B resume attempt, no retry or prompt repair, at most 89 new
chat calls, 178 preflight requests and 150,000 new prompt-plus-completion
tokens. CLI time limit 15 minutes; whole experiment limit 20 minutes,
including server startup. Sample process and device resources. If an
infrastructure failure occurs before any new model call, record it and stop;
authorize another attempt only with a separate frozen amendment. Save the
private full report, copied SQLite and output even on failure. No model
request receives Russian references.

Acceptance is **structural only**: 117 durable checkpoints, 467 source IDs,
timings and protected bytes intact, exactly one full result with
`needs_review`, and a separate Russian SRT. Compare same source cue IDs with
the frozen 7B output; do not select a release model by completion alone.
Source rights, human speech alignment, independent Chinese-Russian judgment,
approved spoken script, TTS listening and clean Windows release gates remain
open regardless of this outcome.
