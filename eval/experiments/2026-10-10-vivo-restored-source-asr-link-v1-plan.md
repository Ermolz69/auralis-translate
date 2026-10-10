# Restored Vivo YouTube SRT and retained full-audio ASR: frozen linkage

Date: 10 October 2026. Partial `DATA-03` follow-up to the
[exact-byte source restoration](2026-10-10-youtube-vivo-caption-restoration-v2-result.md).
This read-only screen links newly restored original-platform Chinese SRT bytes
to an already retained independent full-media ASR raw response. It is not a
new ASR/model invocation, listening test or source admission.

Identity: `DATA-03-vivo-restored-source-full-asr-link-2026-10-10-v1`.
Inputs, all read-only and hash-pinned:

- Restored YouTube SRT: 467 cues, SHA-256
  `b100803367b95fa55fc638b1ff39a0abfa0d5b8183ebe58d58b1a87242d9d8c4`.
- Matched 1,115,570-ms WebM: SHA-256
  `7ad0484b31a6788c31632616649c51e6aaf6cdcdd7d90083d88e1d5ee66e1507`.
- Previous full-audio offline ASR raw JSON: SHA-256
  `a1f92de3e5d2a84baf070851e8248e6455ad432f1e63241749e543865f10d78e`;
  499 segments, `Systran/faster-whisper-base` revision
  `ebe41f70d5b6dfa9166e2c581c45c9c0cfc57b66`, CPU/int8, Mandarin
  forced, beam 5, VAD and previous-text conditioning off. Its prior run did
  not receive Chinese subtitle text.
- Retained OpenCC `t2s.json` conversion of that raw JSON: SHA-256
  `3001a246c8d2ac66d41e07d2a49a3f47730daf5ec2a8eed41f3376c41d601a6f`.
- Public full-ASR v2 and OpenCC v1 reports remain immutable comparison
  baselines; compare their pinned hashes and aggregate results.

Recompute whole-file cue/time alignment and ordered-character recall with
the previously committed scoring rule. Also evaluate exactly three source
windows: 0–12 s, 563–575 s and 1,102–1,114 s, selecting every intersecting
cue and ASR segment. Report cue IDs, time coverage and raw/script-normalized
score counts, but no subtitle words or ASR transcript in the public JSON.
Use the same 0.5-second tolerance and 0.40 low-recall priority threshold.
Do not select new windows after seeing scores or call the model again.

Budget: one offline computation, zero network/model/ASR/TTS calls, zero
retries and no modification of source, raw results or accepted translations.
The retained full-audio ASR was conditioned on no subtitle text, but overlap
and character recall cannot establish exact words, speaker mapping or audio
rights. There is no independent Chinese listener. Keep all 467 cues
unadmitted regardless of the numeric result.
