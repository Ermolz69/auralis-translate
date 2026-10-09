# Source clock review v1: frozen offline replay

Date: 9 October 2026. Tasks: `EVAL-04`, `REG-070`. The previous
[source-fact hint screen](2026-10-09-source-fact-hints-v1-result.md) was
rejected after changing a natural after-midnight statement into an
11-to-12-at-night statement. This slice tests a source-derived, post-answer
warning without a new prompt, model request, retry or automatic repair.

## Fixed inputs and rule

- Original-platform Vivo SRT: 467 cues, SHA-256
  `b100803367b95fa55fc638b1ff39a0abfa0d5b8183ebe58d58b1a87242d9d8c4`.
- Complete v8 7B Russian draft: SHA-256
  `4451868ea3e7cbb3ed81f3d24b5f85bc61a749168b213c54c88ae552208c4831`.
- Prior paired raw journal: 36 chats, SHA-256
  `72e52f740ffa1b4dce7e88168a6872eb2687ab44e1f39fd19e0316a10b8f767f`.
- Split: exposed natural development, including cue 328; no holdout or
  independent rating. Model, v8 manifest, runtime and request identities are
  exactly those in the prior reports. No inference is scheduled here.

The first narrow rule reads the current Chinese cue and at most its preceding
cue when IDs are consecutive and the timing gap is 0–4,000 ms. It recognizes
explicit after-midnight one/two o'clock expressions, evening eleven/twelve,
and afternoon one/two. It warns only when an explicit Russian clock expression
conflicts with the recognized source class. Unknown wording, ambiguous
neighbors, distant context and paraphrases without a recognized clock
abstain. The warning is a review request, never a corrected translation or
proof that unflagged cues are accurate. It must not mutate the SRT, v8
profile, stored checkpoints or prior raw replies.

## Bounded replay and admission

Run deterministic authored related and negative controls first, including
near/far cue boundaries, midnight versus evening, afternoon, source ambiguity,
Russian inflection and negated mentions. Then scan exactly the pinned 467-cue
draft and the one pinned natural cue-328 baseline/candidate pair. Maximum
inputs: two SRTs, one existing JSONL journal, zero model/TTS/ASR calls,
zero retries. Store only hashes, counts, cue IDs and warning kinds in the
public report; retain Chinese/Russian text only in private inputs. Rehash
every input on each private check.

Admission for an evaluation-only diagnostic requires flagging the known
wrong-hour full-draft and rejected candidate, abstaining on the prior
correct-hour baseline, and no false warning on the authored negative
controls. Every additional natural warning must be manually inspected and
retained as unconfirmed until Chinese–Russian review. A product warning,
strict rejection or long-file promotion requires a separate versioned
contract, second source family and measured false-positive review. This
single-source replay cannot close G3–G5, `LONG-04` or `RELEASE-05`.
