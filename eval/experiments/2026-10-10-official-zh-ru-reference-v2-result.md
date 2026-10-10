# Complete-clause official reference v2: one temporal error remains

Date: 10 October 2026. Partial `CTX-03`/`EVAL-04` development evidence.
The [v2 plan and six source-only request hashes](2026-10-10-official-zh-ru-reference-v2-plan.md)
were committed at `0ec2043` before inference. The same published
[Chinese–Russian official PDF](https://russian.shanghai.gov.cn/cmsres/48/4855cd1c48564d2989afe7a96a6a7fd1/a238e3cbc8f237ac6d8fa6a9572406d0.pdf),
7B model, v8 template, seed, decoding and reference separation from the
[rejected v1 screen](2026-10-10-official-zh-ru-reference-v1-result.md)
were retained. The PDF credits the Institute of Party History and Literature
for its Russian translation. This is written policy prose, not recorded
speech or conversational subtitles.

The single v2 run returned **6/6 structurally valid replies** and used 12
template/tokenizer preflights, 2,202 reported model tokens and 33,797 ms wall
time (13,659 ms summed chat time). Peak sampled tracked-process working set
was 5,059,604,480 bytes. No model retry, ASR, TTS or network call occurred.
The pinned private attempt is
`.cache/eval/official-zh-ru-reference-2026/attempt-v2-r7mfWG/`;
raw journal SHA-256
`ab9b33335feead4def7c48037ccddf72213177ad2d8680d356d2ab2a63244748`
and attempt report SHA-256
`d0080ae186385f34651ad540f2481bd837546f421de835ba9a7a40c35048fbaf`.
The private published-reference alignment, extracted only after replies were
saved, is SHA-256
`f3d2b1e4454c2869bf0d81d0f5babe17bce6e266ebc6bb50122d1df3754759f1`.
The [source-free machine report](../reports/2026-10-10-official-reference-v2.json)
pins every request, accepted-output hash, token and time observation; its
SHA-256 is
`3ae81fcf37ed49579c7c47be4f2184b9d355547e108b6b88295d12ec71f83859`.

## Paired source-aware assessment

| Case | v1 → v2 observation | AI assessment against Chinese and published Russian |
| --- | --- | --- |
| 2025 policy action | Answer byte-identical despite added 2025 retrospective heading | **Major temporal-status error:** it prescribes a policy action that the source section and published translation report as conducted. |
| Draft's 20 indicators | Adds an explicit proposed-indicators qualifier, while also describing implementation | Mixed wording; severity uncertain. |
| Proposed research growth above 7% | Full Chinese paragraph adds the omitted proposal clause | Proposed status and number are now present; the model's requirement wording is more categorical than the published expectation. |
| Planned 17% carbon-intensity reduction | Full Chinese paragraph adds the omitted proposal clause | Planned status, percentage and per-GDP relation are now present. |
| Completed economy and innovation controls | New source-only past controls | Both remain completed achievements in Russian. |

The v1 fragmentary research and carbon cases are **not paired quality wins**:
their inputs changed by restoring information the model had never received.
The [separate AI review](../reports/2026-10-10-official-reference-v2-ai-review.json)
records one high-confidence major issue and one explicitly uncertain case.
There are **zero independent reviews of model output**. A published human
translation supplies a reference, but no human has rated our answer. Literal
overlap and style differences are not used as an accuracy percentage.

The persistent retrospective error is frozen as
[REG-085](../regressions/reg-085-retrospective-context-tense-v1.json), with a
minimal request/answer reproduction and six new related or negative Chinese
controls. [Catalog v61](../regressions/catalog-v61.json) retains the
earlier REG-084 caption-fetch case separately. These six temporal controls
have zero model results so far. The v2 source
preflight now asserts that the previously omitted proposal clauses and
retrospective headings are actually present. No prompt patch or product
promotion follows from one formal-prose error. The next measured translation
step is a separately bounded same-source control screen and a natural
subtitle counterpart for temporal status, then a paired candidate only if
those show a general issue.

`task eval:official-reference:preflight`, `task
eval:official-reference:v2:freeze`, `preflight`, `probe`, `report` and `check`
passed. `task eval:regression:reg085:check` and
`task eval:regression:catalog:v61:build`/`check` passed; these checks verify
raw identities and the new unrun controls, not language adequacy.
`task eval:regression:catalog:portable:check`, `task plan:check`,
`task docs:check`, `task site:build` and `task site:check` passed after the
report was added to the current public page. These are provenance and
publication-build checks, not a semantic acceptance score. Product
v8, original Chinese subtitles, accepted Russian drafts and all prior raw
results remain unchanged. G3–G5, the long-file quality gate and RELEASE-05
remain open; rollback is to omit this evaluation-only screen.
