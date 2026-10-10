# Vivo full-ASR Chinese-script normalization: frozen comparison

Date: 10 October 2026. Partial `DATA-03`, follow-up to the
[full-audio ASR screen](2026-10-10-vivo-full-audio-asr-result.md). The only
factor changed is traditional-to-simplified conversion of the **retained ASR
text** before the same cue/segment matching and ordered-character recall.
The original SRT, source video and ASR raw response remain immutable.

The source SRT SHA-256 is
`b100803367b95fa55fc638b1ff39a0abfa0d5b8183ebe58d58b1a87242d9d8c4`;
the single private full-ASR JSON is
`a1f92de3e5d2a84baf070851e8248e6455ad432f1e63241749e543865f10d78e`.
The raw-score baseline is [v2](../reports/2026-10-10-vivo-full-audio-asr-v2.json),
SHA-256 `e378afc97915eeef133c3df79eb828742c25c35c3472b92bc4e9cd12783d10df`.
Use official [OpenCC 1.4.2](https://github.com/BYVoid/OpenCC/releases/tag/ver.1.4.2)
with `t2s.json` only. Its CPython 3.10 Windows x64 wheel is pinned to the
[PyPI SHA-256](https://pypi.org/project/OpenCC/1.4.2/)
`b2af32959214ba7fd475991aaf2476e1f775061708c154cd39782485365dc781`.
The wheel and installed files live in ignored workspace storage. No package
is added to product requirements.

Budget: one wheel acquisition (2.9 MB expected, pip retry count 0, 30-second
per-request timeout), one offline install, one offline conversion of all 499
ASR segments, no ASR/model/TTS calls and no retries after failure. Preserve
failed commands/output. Do not send source text or captions to OpenCC online;
it is a local deterministic conversion. Run fixed controls for traditional
variants, a wrong actor, a missing negation and a changed chip number.

Compare the same 467 cues, 0.5-second overlap, minimum five normalized
characters and raw 0.40 threshold with and without OpenCC. Report changed
scores, remaining low-recall IDs and three-third coverage; inspect a fixed
bounded sample of remaining misses by AI. No automatic semantic or speaker
admission follows. Conversion can itself change ambiguous Chinese words, so
the scores remain review priorities and human listening/rights stay open.
