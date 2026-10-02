# Cross-group caption overlap screen on current private sources

Date: 2 October 2026. Partial `DATA-05` result under the
[predeclared plan](2026-10-02-cross-group-caption-overlap-plan.md). The
starting committed Translate baseline was `33ae23e`; the unrelated edit to
`docs/architecture/014-result-history-selection.md` was excluded. No source,
reference, model, TTS or network request was added to this slice.

## Reproduction and method

The preceding exact-identity guard correctly rejects identical SRT SHA-256
or declared media identity, but accepts an authored pair with different hashes
and media URLs even when the Chinese transcript is the same. The new screen
detects that pair after changing cue times and boundaries, and detects a
substantial partial copy and sparse character edits. Same-group alternate
versions, unrelated long text, a short common phrase and repeated boilerplate
are control cases. The initial test run before adding the detector failed with
`ERR_MODULE_NOT_FOUND`; that output is retained privately at
`.cache/eval/cross-caption-overlap/pre-repair-test.txt`. This was an absent
check, not a prior release failure or model regression.

The screen reads the nine current manifests and rehashes all eleven retained
private SRTs before parsing. It concatenates cue text, keeps NFC lowercase
Unicode letters and digits, then compares unique sliding 32-codepoint windows.
A cross-group pair is flagged at **64 shared windows and 2% of the smaller
set**. These values were frozen in the plan before checking the current data.
Every flagged pair requires source-aware adjudication; no pair is silently
relabeled or discarded. The deterministic machine-readable
[report](../reports/source-caption-overlap-v1.json) has SHA-256
`5e875edee0357fcf9f742f8061c200cdeb3639d154ad226b9fb2a739591f1e40`.
It includes manifest and source hashes, cue counts, normalized lengths and
pair summaries, without publishing subtitle text.

## Observed current result

- 11 track records, 10 media groups and **54 cross-group pairs** were checked;
  **0** exceeded the frozen threshold. No source gained admission or a human
  rating.
- The two Kirin revisions in their existing shared group have **4,010 of
  4,176** distinct 32-codepoint windows in common on the smaller track
  (96.0% when rounded to one decimal). This supports a shared textual
  lineage despite different SRT hashes and cue counts. It is not a measured
  audio, timing, scene or rights alignment.
- All eleven SRT hashes and cue counts matched their manifests. No source or
  accepted result was edited; historical manifests and measurements remain.

`task eval:data:check` passed the authored overlap controls alongside source
schema, exact-identity and media-boundary checks. `task
eval:data:current:bytes:check` passed eleven private-byte checks, nine
manifest checks, the exact-identity guard and the pinned overlap report check.
The future audit still needs edited near-duplicate review beyond this exact
window method, simplified/traditional conversion, source rights, speech and
scene alignment, independent references, sealed split assignment and reviewer
coverage. A zero-flag result is **not** a clean DATA-05 or release decision.
