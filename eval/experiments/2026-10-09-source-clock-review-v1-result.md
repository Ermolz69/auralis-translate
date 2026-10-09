# Source clock review v1: offline warning replay

Date: 9 October 2026. This is a bounded `EVAL-04`/`REG-070` replay of the
[frozen plan](2026-10-09-source-clock-review-v1-plan.md), not a translation
improvement or a release language score. No model, ASR or TTS call was made.
The source, full v8 draft, prior paired raw journal and original checkpoints
were read only. The evaluation-only rule does not change a prompt, profile,
Russian subtitle or accepted result.

## Inputs and result

The original-platform Chinese SRT SHA-256 is
`b100803367b95fa55fc638b1ff39a0abfa0d5b8183ebe58d58b1a87242d9d8c4`;
the completed v8/7B Russian SRT is
`4451868ea3e7cbb3ed81f3d24b5f85bc61a749168b213c54c88ae552208c4831`.
The retained 36-chat journal is
`72e52f740ffa1b4dce7e88168a6872eb2687ab44e1f39fd19e0316a10b8f767f`.
The warning rule SHA-256 is
`ee240fe846ce67e931da0c4da2c4f7d0e295ef06c82a5ee3f6672f2076910aac`.
The [source-free machine report](../reports/2026-10-09-source-clock-review-v1.json)
SHA-256 is
`403f27b26e9b9f7562b44079ae509075d13e96d0fe6121a8e0a42c1ba6d955cd`.
It contains cue IDs and warning classes, not licensed source or Russian text.

All 467 source/draft IDs and timing rows matched. The narrow source rule
recognized **one of 467** cues, cue 328, and warned on its full-draft
11-to-12-at-night rendering of an after-midnight one-to-two source statement.
On the prior same-source 7B pair, the baseline response received no warning
and the rejected fact-hint response received the same cue-328 warning.
Their exact request and raw HTTP hashes were rechecked against `REG-070`.
Five deterministic test groups covered related early-morning forms,
late-evening and afternoon contrasts, Russian word/numeric forms, cue gaps,
overlap, changed IDs, negated mentions and abstention on unsupported
paraphrases. The test count is five groups, not five individual sentences.

This diagnostic flags a clear contradiction for **review**; it cannot tell
whether the other 466 cues are correct. It does not detect the known
36-month relation, team referent or future-product errors, nor every time
paraphrase. No second natural source family or independent bilingual review
has measured its false-positive or false-negative rate. It remains in
`eval/`; v8 production acceptance and both full drafts are unchanged.

## Execution, failed attempts and decision

`task eval:source-clock:report` first failed before reading private inputs
because the clean checkout had no local raw copy. A second attempt with the
explicit asset root reached the pinned journal and failed an incorrect
harness assertion (`ok` versus the recorded `valid_unreviewed` status).
Both infrastructure/harness failures are retained here; neither launched
inference. After correcting the assertion, `task eval:source-clock:report`
and `task eval:source-clock:check` passed. The latter rehashes all three
private inputs and checks the authored controls on each run.

**Decision:** retain this as an evaluation-only warning. Before a product
review gate, test a separately frozen second source family, inspect
additional natural warnings with a Chinese–Russian reader and version any
new profile or diagnostic contract. Keep `REG-070` unfixed, and do not
interpret a missing warning as permission to publish or dub. Rollback is
simply the unchanged v8 profile and existing stored SRTs; removing this
`eval/` rule does not touch their bytes. G3–G5, `LONG-04`, A1–A6 and
`RELEASE-05` remain open.
