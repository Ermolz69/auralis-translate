# Source relation review v2: shorthand false negative warned

Date: 10 October 2026. This is the offline `REG-071` replay in the
[frozen plan](2026-10-10-source-relation-review-v2-plan.md). It did not
change the v8 prompt, product validator, Russian SRT or any checkpoint.

The original Chinese SRT SHA-256 is
`b100803367b95fa55fc638b1ff39a0abfa0d5b8183ebe58d58b1a87242d9d8c4`;
the complete v8/7B draft is
`4451868ea3e7cbb3ed81f3d24b5f85bc61a749168b213c54c88ae552208c4831`.
The retained 36-chat journal and new 20-chat focus journal are
`72e52f740ffa1b4dce7e88168a6872eb2687ab44e1f39fd19e0316a10b8f767f`
and `bc6508be55d9e9862a54a60102b36de4db427c3281eb5ff9fb2ba12ee32f4de7`.
All were rehashed on report capture and check. The [source-free v2 report](../reports/2026-10-10-source-relation-review-v2.json)
is `98d72ac7e45beb9dab56ebc9c82b840b38c59e023727f46d63d3dbbacf88d0c9`.

V2 retained the v1 full-draft warnings at cues **276, 280 and 466**, with
**zero** additional warnings among the 467 saved cues. It replayed six old
natural replies and the two new cue-466 batch/focus replies. The
[REG-071 minimal reproducer](../regressions/reg-071-future-product-shorthand-review-v1.json)
was unflagged by v1 and warned by v2; related bare-present forms and
contrasts for hope, negation, explicit present source and cue adjacency
passed four new deterministic groups. The original four v1 groups passed
again. The reply is still semantically wrong under AI triage and was not
retranslated or accepted. Zero new model/ASR/TTS calls, zero human ratings.

`task eval:source-relations:v2:report` and
`task eval:source-relations:v2:check` passed. The false-positive rate on
another natural source is unknown. Keep v2 in `eval/` only; absence of a
warning cannot approve a subtitle or spoken script. G3–G5, `LONG-04`,
`VOICE-01` and RELEASE-05 remain open. The v1 rule/report and failed
focus-slot model answers remain immutable for rollback.
