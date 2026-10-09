# Local audio/caption triage on the matched Vivo source

Date: 9 October 2026. Backlog: `DATA-03`. The owner has no Chinese–Russian
reviewer and asked to use Chinese YouTube sources with non-automatic captions.
The [source-version screen](2026-10-09-youtube-manual-chinese-source-result.md)
found one matched 18:36 Vivo interview, but nobody has listened to its speech.
This experiment is an **AI-only diagnostic**, not `development_only`
admission, a human review, a new product ASR feature, or the separate
`ASR-01` source-creation lane.

Use only three previously decoded 12-second windows of the hash-pinned
Commons video and the original-platform SRT. Audio inputs, in order:
`start.wav` SHA-256 `1774c0fe3449dd594af58cf4ebf8f037cc0df0b0812f6727e7338c71d680e402`
at 0 s, `middle.wav` SHA-256
`851cf0e806a10b0b1e85eefe39229fc4eb7c551a3f331693730afd4ac9c837d3`
at 563 s, and `end.wav` SHA-256
`1259b66490f21ef5a43d88feacbb5238a64cfbb220eb512e260d896b47d0c970`
at 1,102 s. The original-platform Chinese SRT SHA-256 is
`b100803367b95fa55fc638b1ff39a0abfa0d5b8183ebe58d58b1a87242d9d8c4`.
The related media SHA-256 is
`7ad0484b31a6788c31632616649c51e6aaf6cdcdd7d90083d88e1d5ee66e1507`.
No Russian reference or Chinese cue text enters the ASR request.

Install `faster-whisper==1.2.1` once into ignored workspace storage using
Python 3.10, zero pip retries, 30-second network timeout per package and
a five-minute process cap. Download only
`Systran/faster-whisper-base` at revision
`ebe41f70d5b6dfa9166e2c581c45c9c0cfc57b66` (published MIT model card),
restricted to config, weights, tokenizer and vocabulary, with a 220-MiB
post-download model-size cap. Record package versions and file hashes.
Run CPU `int8`, Mandarin forced, beam size 5, no previous-text conditioning,
at most three windows in one 10-minute process. Save raw transcripts and
timings privately, plus a redacted summary of speech-language detection and
source/caption agreements or conflicts. Stop on the first infrastructure,
download, model or runtime failure; retain it and do not silently retry or
switch model. The result can prioritize human review but never substitute
for a named listener or resolve the subtitle/audio rights.
