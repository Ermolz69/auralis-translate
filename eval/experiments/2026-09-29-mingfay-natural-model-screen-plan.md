# Frozen private Mandarin same-source model screen

Date: 29 September 2026. Tasks: DATA-03, CTX-02, EVAL-04. This is an
exploratory screen on a real creator caption with unresolved rights and audio
alignment, not admitted development data, a release holdout, or a human
translation score. The video download attempt returned HTTP 403 and is kept
separately; the [Chinese-only caption derivative](2026-09-29-youtube-mingfay-caption-candidate.md)
is still available for a private text experiment.

Source identity: candidate SRT SHA-256
`42109FC054CBA93B0EF343853628B6A248B31664786D579BDEFA415CCAACF9EE`,
230 ordered cues, 14,321 bytes. The exact four contiguous windows, with
creator timings retained, are cues `1–4`, `114–117`, `209–212`, and `227–230`.
The first covers the greeting, creator name and residential setting. The
middle describes a courier going upstairs, an unlocked delivery vehicle and
that situation being common in China. The repaired boundary describes cats
eating meat, including raw meat/bones, and the definition of a stray cat.
The end contains calls to subscribe/comment/like, an optional membership
request and a farewell. These are assistant source interpretations, not
independent Russian references; exact Russian wording is not frozen as a
pass condition. The source text/expected facts are never inserted as target
answers into prompts.

Each model sees the **same four SRT window byte strings** and one 4-cue
source-only scene map per window. The source is a single unassigned group and
cannot be used as a sealed holdout. Compare checked Hy-MT2 1.8B Q4_K_M and
7B Q4_K_M with their existing v5 scene profiles, same
`b10977-0ecb159c9` llama.cpp build, same 2,048 context, 256 response tokens,
temperature 0.7, top-p 0.6, top-k 20, repeat penalty 1.05 and single GPU
runtime. Use one repetition per model, serially, with no adaptive retries or
prompt/profile edits. Run `task eval:natural:mingfay:1b:probe` then
`task eval:natural:mingfay:7b:probe`.

Per model budget: four complete 4-cue files, at most 20 chat requests and 68
total proxied HTTP requests, 600 seconds after model readiness and 180
seconds for doctor/readiness. The runner retains the exact SRT windows,
scene maps, raw HTTP requests/responses, accepted targets, CLI command
outputs, SQLite state, token counts, timings, source/output hashes, sampled
working set/GPU and failures in a fresh ignored workspace. Successful output
must pass strict source/result protected-byte and cue-count checks and
byte-identical offline re-export. The durable journal checker compares the
retained proxy requests with SQLite. Failed runs are not overwritten or
silently regenerated.

AI source-aware inspection later records supported/uncertain meanings, names,
negations, cue boundaries and omission/added facts separately from structural
acceptance. No G3/G4 percentage, model selection, dubbing approval or
general language conclusion follows from 16 unreviewed cues. A bilingual
reviewer and natural complete-file run remain required.
