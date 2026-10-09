# Original-platform Vivo v8 long-file screen: one complete candidate, quality open

Date: 9 October 2026. Frozen [plan](2026-10-09-vivo-original-v8-long-plan.md)
at `780f4a1`, with the retained pre-spawn failure amendment at `713b5d2`.
The private source is the creator's 18:36 [Vivo/MediaTek interview](https://www.youtube.com/watch?v=_G4e2p1p-is)
with a separately supplied `zh-CN` SRT. Its 467-cue original-platform SRT
SHA-256 is `b100803367b95fa55fc638b1ff39a0abfa0d5b8183ebe58d58b1a87242d9d8c4`;
the matched private media SHA-256 is
`7ad0484b31a6788c31632616649c51e6aaf6cdcdd7d90083d88e1d5ee66e1507`.
This is known, unreviewed development material. No reference or previous
Russian translation entered either model request.

The first probe passed all file/model checks, then stopped before a server or
model call on `spawn EPERM`. Its private report SHA-256 is
`3a8ea031258fd13ffeb3e7ccb7105f016385117dc9133dd155529cf7c58be643`.
The separately frozen infrastructure retry succeeded in launching both arms.
The complete private report SHA-256 is
`84a737e1cc8c7b468ea66718f2507882929344f259d7824d9071953d24c1a5b5`;
the [source-free machine report](../reports/2026-10-09-v8-vivo-original-long.json)
SHA-256 is `d83a4f518065cacd3de54d2de3716d5a488b4aa23e0c96a4bc31053f8c2ab089`.
All raw requests, replies, restored candidates, SQLite states, process logs
and resource samples stay in ignored private storage. The model/runtime,
manifest and old CLI hashes are in the machine report.

| Observation | 1.8B Q4_K_M v8 | 7B Q4_K_M v8 |
| --- | ---: | ---: |
| Chats / template-token preflights | 29 / 58 | 117 / 234 |
| Durable batches and covered cues | 28 / 112 | 117 / 467 |
| Prompt / completion tokens | 12,930 / 4,261 | 54,841 / 18,009 |
| Summed chat HTTP time | 34,842 ms | 496,863 ms |
| CLI time | 49,564 ms | 573,069 ms |
| Full SRT / review state | none | one, `needs_review` |
| Observed server working set | 1,544,757,248 B | 5,102,968,832 B |
| Whole-device GPU maximum sampled | 3,528 MiB | 7,536 MiB |

The arms used one server at a time and one stochastic run each. Their
different completed prefixes prevent a full-file paired adequacy or speed
claim. GPU use includes other applications; sparse samples are lower bounds
on process peaks. The two-arm diagnostic took 636,534 ms, including model
loading and report collection, under the declared 40-minute cap.

The 1.8B reply for cues 113–116 had the correct four IDs and stopped normally,
but each `text` ended in an escaped line feed. The old decoder rejected it
before checkpoint 29. Thus 28 batches remain durable, with no result row or
partial SRT. [REG-065](../regressions/reg-065-vivo-v8-terminal-line-break-v1.json)
pins the exact raw request/reply hashes and four related plus five negative
controls. A deterministic provider change now strips only terminal CR/LF after
JSON parsing while preserving the raw reply; internal/leading controls,
empty text and leaked JSON remain rejected. `task test:long-batch-v8`
passed 10 provider, 16 profile and five CLI tests after that change. The
full 1.8B natural file has **not** been rerun with the changed binary.
An initial attempt placed this normalization in the version-hashed prompt
module and failed its identity tests. That change was reverted; the provider
boundary keeps the established v8 prompt bytes and manifest hash intact.

The 7B arm completed 467/467 mapped cues with all source IDs and timing
lines preserved, one validated result and a separate Russian SRT SHA-256
`4451868ea3e7cbb3ed81f3d24b5f85bc61a749168b213c54c88ae552208c4831`.
An initial offline export from a copied database failed because the copied
record still pointed outside its state directory; that report remains SHA-256
`034922b0f4d048cd68f5e832395a353f7d2bee865c04e2851e924390d47d767f`.
After verified relocation of the managed source path **inside a new copy**,
offline `resume` contacted no model server and reproduced the SRT byte for
byte. Its private report SHA-256 is
`c218ebe91ee4c7930a5505f946a480baff12538ee300045b8f9abb8e95e21eec`;
the original state and source hashes were unchanged.

## AI source-aware triage, not a human score

The beginning, middle, end, selected batch seams and previously known fact
risks were inspected against the Chinese source. On the common 112-cue
prefix, 1.8B cue 60 mixes French lettering into a Russian word; 7B keeps the
9400 generation but this is not a general model-size win. The full 7B
candidate repeats the earlier v5/7B risks: cue 276 attaches the 36-month
lead to an imaginary “earliest phase”; cues 280–281 turn a jointly committed
1,000-plus-person development team into invested money plus a detached team;
cue 328 shifts work until 1–2 a.m. to 11–12 at night; and cue 466 changes a
hope for future better products into a present availability claim. The
[existing REG-025–027 packs](../regressions/natural-vivo-numeric-time-v1.json)
retain minimal source-aware reproductions, related and negative controls;
these v8 recurrences require a separately budgeted model recheck. Other
segments and speakers remain unscored. No Chinese–Russian human adjudication
was available, so these are AI findings and review priorities, not G3–G5
rates or an approved spoken script.

The original-platform SRT and audio remain `inspected_candidate` with zero
eligible cues: separately needed usage rights and human speech alignment
remain unresolved. The 36-second ASR triage is not a listener. This run
adds partial `CTX-02`, `LONG-01/02/04`, `EVAL-04` and `DECIDE-01` evidence,
but selects neither model, does not advance Auralis dubbing and does not
close RELEASE-05. Next: verify the deterministic REG-065 fix on a new
committed binary in a separately bounded copy-only recovery, compare the
same reached cues under source-aware controls, then resolve the recurrent
fact failures before any candidate promotion.
