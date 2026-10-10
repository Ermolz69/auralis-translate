# Vivo audio/caption comparison after pinned Chinese-script conversion

Date: 10 October 2026. Partial `DATA-03` follow-up to the [single full-audio
ASR result](2026-10-10-vivo-full-audio-asr-result.md). The
[frozen plan](2026-10-10-vivo-opencc-recall-plan.md) and conversion code at
`b903481` preceded the package acquisition and paired scoring. The Chinese
SRT (467 cues), video and original 499-segment ASR response are unchanged;
their SHA-256 values remain
`b100803367b95fa55fc638b1ff39a0abfa0d5b8183ebe58d58b1a87242d9d8c4`,
`7ad0484b31a6788c31632616649c51e6aaf6cdcdd7d90083d88e1d5ee66e1507`
and `a1f92de3e5d2a84baf070851e8248e6455ad432f1e63241749e543865f10d78e`.
No new ASR, translation model or TTS call occurred.

## One-factor local comparison

The official [OpenCC 1.4.2](https://github.com/BYVoid/OpenCC/releases/tag/ver.1.4.2)
CPython 3.10 Windows wheel was downloaded once from PyPI, 2.9 MB, with the
[published SHA-256](https://pypi.org/project/OpenCC/1.4.2/)
`b2af32959214ba7fd475991aaf2476e1f775061708c154cd39782485365dc781`.
It was installed once from the local wheel into ignored diagnostic storage.
Six fixed controls passed: three traditional-to-simplified examples and
three differences that must remain (actor, negation, chip number). OpenCC's
`t2s.json` converted 322/499 ASR segments in 0.004 seconds. The converted
private response is SHA-256
`3001a246c8d2ac66d41e07d2a49a3f47730daf5ec2a8eed41f3376c41d601a6f`.
It was never written over the raw response.

The same cue mapping and ordered-character metric were then applied to the
same 467 SRT cues. Every cue still intersects an ASR segment within the
declared 0.5-second tolerance. On the 461 cues with at least five comparison
characters, raw low-recall flags fell from **30 to 5** after script
conversion; 306 cue scores rose, 161 were unchanged and none fell. The
[source-free paired record](../reports/2026-10-10-vivo-opencc-recall-v1.json)
is SHA-256
`48e202733c4a67de582ff7b05cf6c43a737e91b3bcd2e8a5645a3c2da8fc1c95`.
Remaining low-recall cue IDs: 132, 223, 329, 415 and 464 (one, one and
three in the first, middle and last third respectively).

## AI inspection of the five remaining priorities

The retained ASR text mangles Vivo's chip-stack wording at 132, MediaTek and
the disagreement phrase at 223, MediaTek colleagues at 329, and Tianji
9300/9400 numbers at 415. The short thanks at 464 is split across ASR
segments and remains low-scoring. These are **AI comparisons of text**, not
listening; some may reflect ASR errors, different wording, timing or a
subtitle issue. No caption error count is adjudicated. The conversion can
also alter ambiguous Chinese words, and character recall is not a measure
of translation quality or speaker assignment.

The original-platform regular SRT is still unproven as a manually edited
word-level transcript. Video reuse is advertised under CC BY but Commons
license review, caption-text rights and audio-component rights are not
settled. A Chinese-speaking listener and independent Chinese–Russian
reviewer are unavailable. The scene stays a private `inspected_candidate`
with **zero eligible development or holdout cues**. G3–G5, A1–A6 and
`RELEASE-05` remain open; product v8 and accepted results are unchanged.

`task eval:data:youtube:vivo:opencc:acquire`, `install`, `test`, `convert`,
`report` and `check` passed. Rollback: use the immutable raw-ASR v2 report
and original SRT/WebM; the OpenCC post-processing lives only in `eval/`
and ignored private storage. Preserve both reports for future method audits.
