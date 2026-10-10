# Vivo full-audio subtitle alignment screen: frozen plan

Date: 10 October 2026. Backlog: partial `DATA-03`. This extends the retained
three-window audio diagnostic to the complete selected 18:35.570 interview.
It is an AI-only private source screen, not a human listening check, a
translation model comparison, an ASR product feature, or source admission.

## Fixed inputs and budget

- Original-platform Chinese SRT: 467 cues, SHA-256
  `b100803367b95fa55fc638b1ff39a0abfa0d5b8183ebe58d58b1a87242d9d8c4`.
- Matched Commons 240p WebM: SHA-256
  `7ad0484b31a6788c31632616649c51e6aaf6cdcdd7d90083d88e1d5ee66e1507`.
  Its local path must be supplied as a read-only asset root. No fresh download.
- Existing `Systran/faster-whisper-base` revision
  `ebe41f70d5b6dfa9166e2c581c45c9c0cfc57b66`, with the four file
  hashes in the three-window machine report. Reuse the installed
  `faster-whisper==1.2.1` package and its pinned transitive versions. No
  package installation, model download, reference text, prompt or glossary.
- One full-media CPU/int8 ASR attempt, Mandarin forced, beam 5, VAD disabled,
  previous-text conditioning disabled. Maximum 15 minutes, 1 MiB captured
  process output, 2,000 segments. Stop on failure or timeout and retain it;
  no retry, different model or inference settings in this experiment.
- No translation or TTS process runs concurrently. Existing three 12-second
  windows are a historical comparator, not extra inference in this slice.

Before the single probe, commit this plan, Taskfile commands and source-only
runner. The private runner may read the WebM and model files; the Chinese SRT
is read only by preflight and the later comparison. Hash all inputs before
inference and store raw segments, process record and failures in ignored
storage. The public report contains hashes and aggregate counts, not full
source text, media or raw ASR wording.

## Prespecified comparison and decision

Map each SRT cue to ASR segments whose time intervals intersect its cue
interval widened by 0.5 seconds. Normalize whitespace/punctuation and
compare Han/letter/digit sequences using ordered-character source recall
recall; cues with at least five normalized characters and recall below 0.40
are *review priorities*, not proven caption errors. Report cue coverage,
score distribution, low-recall IDs, and first/middle/last-third counts.
Use source-aware AI inspection only to explain a bounded set of mismatches,
with reviewer type explicitly `ai`. Do not infer exact speaker alignment or
word-perfect subtitles from ASR. Human listening, caption rights and release
admission remain open regardless of the result.
