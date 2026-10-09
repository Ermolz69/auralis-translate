# Technical sense v1 screen stopped before inference

Date: 10 October 2026. The [predeclared screen](2026-10-10-vivo-technical-senses-v1-plan.md)
froze 20 baseline/candidate request hashes at SHA-256
`c2816d2a50571ec1abf168b1eb317891911094867e1311ab897162226bba7f61`.
`task eval:vivo:technical-senses:freeze` and
`task eval:vivo:technical-senses:preflight` passed source, model, runtime,
manifest and exact request checks. The separate source-aware preflight read
the ten candidate decisions and found a **false abstention**: cue 393
uses affirmative `不断` (“continue”), but the v1 clause-wide character
test treated its `不` as negation. Candidate and baseline request hashes
for that cue are both
`fdc969ff84ce243b1c2112e015bbb42575b2cbb19a1df0ede1d6ce129e857084`.
Thus the planned candidate cannot test the third natural technical term.
The precise source/inventory hashes and six new related/negative controls
are pinned in [REG-075](../regressions/reg-075-continuation-not-negation-v1.json).

**Decision: reject this frozen candidate before model startup.** Chats,
tokenizer/template preflights, TTS/ASR calls, checkpoints and accepted SRTs:
0. The frozen request file and v1 helper stay unchanged. A separately
versioned v2 screen may correct this false abstention, retaining genuine
negation/mention byte identity. No evidence about Russian meaning or model
quality follows from this preflight. Product v8 remains unchanged.
