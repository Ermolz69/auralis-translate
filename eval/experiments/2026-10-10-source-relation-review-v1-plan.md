# Source relation review v1: frozen offline replay

Date: 10 October 2026. Task: `EVAL-04`, known development cases in
`REG-066`. The rejected source-fact prompt changed model behavior and is not
an input to a new translation. This experiment only asks whether a narrow
post-answer diagnostic can expose three known meaning risks in saved output.

## Frozen inputs and budget

- Original-platform Vivo Chinese SRT, 467 cues, SHA-256
  `b100803367b95fa55fc638b1ff39a0abfa0d5b8183ebe58d58b1a87242d9d8c4`.
- Complete v8/7B Russian draft, SHA-256
  `4451868ea3e7cbb3ed81f3d24b5f85bc61a749168b213c54c88ae552208c4831`.
- Existing 36-chat paired source-fact journal, SHA-256
  `72e52f740ffa1b4dce7e88168a6872eb2687ab44e1f39fd19e0316a10b8f767f`.
- Split: exposed natural development, not sealed holdout. Read one pinned
  467-cue source/draft pair and the already saved natural 276/280/466 reply
  pairs once. Zero model, ASR or TTS calls, zero retries, no new translation.

## Rule and controls

Inspect only a target cue and one adjacent Chinese cue with consecutive IDs
and a 0–4,000 ms gap. Recognize these *source* structures: 36 months in
advance of joint planning; joint commitment of a thousand-person development
team without a money claim; and an expectation of better products from future
cooperation. Flag an explicit *target* contradiction: planning placed before
an invented earliest stage, monetary investment substituted for the team, or
products asserted already available. Unrecognized phrasing abstains. A flag
requests review; it does not repair text or certify unflagged text.

Before replay, test each minimal known error, at least one related wording,
and controls with explicit after-start planning, explicit money and team,
already available products, negation, distant/overlapping or changed-ID
neighbors, and harmless paraphrases. Compare warnings on the full draft and
the saved v8 versus rejected-hint answers. Store public cue IDs, classes,
hashes and counts only; private source and Russian text stay local.

Admission is evaluation-only if all three known full-draft risks are warned,
the authored negative controls abstain, and any additional natural warning
is reported as unconfirmed. A product gate needs a separate contract, a
second source family and measured false positives with independent bilingual
review. No G3–G5, `LONG-04` or `RELEASE-05` claim follows from this replay.
