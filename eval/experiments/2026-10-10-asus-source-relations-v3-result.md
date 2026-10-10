# ASUS source-relation v3: three source facts, no warnings, one missed error

Date: 10 October 2026. Partial `EVAL-04`/`CTX-03` development evidence.
The [frozen plan](2026-10-10-asus-source-relations-v3-plan.md) at `9fb6d32`
and implementation at `e28b182` preceded opening the Russian draft. The
268-cue Chinese source SHA-256 is
`923aed3991c2308d92b89c45181cea8ec7ece74e9b4d3a3ce0234d95e329913b`;
the retained 7B/v8 Russian draft is
`746495ba8bfc9c7c3cee0b5021fea87c10605b1d8e07be6dc316907138ea48ee`.
Both remain private and immutable. This source is a distinct exposed ASUS
group, not a release holdout or a version-matched video pilot.

The first preflight exposed a private-path error: the source was in the
integration worktree, whereas the pinned draft was in the primary root.
It stopped before any target-text inspection or capture. The harness then
accepted separate absolute read-only source and draft roots. Repeated
source-only preflight verified all three preselected cue facts and both file
hashes before the implementation commit. No rule was changed after the
target was opened.

One offline replay at 11:01:27 UTC took 91 ms: **268/268 source/target cue
IDs and timing lines matched; three new source relations were recognized
(cues 24, 226 and 253); zero warnings were emitted.** The report SHA-256 is
`8d3eb1020f660fb3c72aa4cc369cc8ca57b394e2089f63e3d7715686f4db8468`.
Its [source-free machine record](../reports/2026-10-10-asus-source-relations-v3.json)
pins the rule SHA-256
`bd1f9926b52150f21d398895237b69ea9e1d4c4698bbc9392e3c52c58604eb03`,
both parent rule hashes, source/draft hashes, coverage and every warning.
There were zero model, ASR, TTS and network requests, zero inference retries,
and no change to any accepted subtitle or checkpoint.

After the freeze, an [AI source-aware review of the three chosen cues](../reports/2026-10-10-asus-source-relations-v3-ai-review.json)
found:

| Cue | Source fact | Saved 7B/v8 draft | V3 warning |
| ---: | --- | --- | ---: |
| 24 | Sticks are not Hall-effect sticks | Negation remains, but Hall-effect sticks become a galvanometric control lever: a technical referent substitution | 0 |
| 226 | BIOS lacks core/hyperthreading disable options | The absence is kept; hyperthreading terminology needs a specialist review | 0 |
| 253 | Price was not announced at review time | The temporal and negative price fact is kept | 0 |

The source term `霍尔` denotes Hall-effect sensing; the [manufacturer's Chinese
Hall-joystick support page](https://support.thrustmaster.cn/zh/product/t16000mfcs-zh/)
supports that reading. The cue-24 finding is an **AI-identified error**, not
an independent bilingual judgment. Its minimal source/accepted-text hashes,
neighbor IDs and six new authored related/negative controls are retained in
[REG-083](../regressions/reg-083-asus-hall-stick-substitution-v1.json).
[Catalog v58](../regressions/catalog-v58.json) is SHA-256
`5a0e1f9fcbfb194e37e1ed65620a1b33ecf268cae47dfa5b42e7cce36f31cfed`.
Those controls have zero model results. The v3 rule detects narrow opposite
affirmations; it missed a substitution that preserves the grammatical
negation. It must not be silently broadened using this exposed result.

**Decision: reject product admission of v3 and keep v8 unchanged.** Three
recognized cues out of 268 show very narrow source coverage. With zero
warnings, natural false-warning precision is undefined, not 100%, and the
AI-identified miss shows the rule is insufficient as a quality gate. There
are zero human language ratings. The next separately frozen experiment may
test Hall-term preservation on new related and negative cases, then a
distinct natural source; it must retain this failed v3 result and measure
false warnings before any product use. `DATA-03`, `CTX-03`, `EVAL-04`,
`LONG-04`, G3–G5, A1–A6 and RELEASE-05 remain open.

`task eval:source-relations:v3:unit`, `preflight`, `report` and `check`, and
`task eval:regression:reg083:check`, `task
eval:regression:catalog:v58:check`, `task
eval:regression:catalog:portable:check`, `task plan:check`, `task
docs:check`, `task site:build` and `task site:check` passed after the path
correction.
Rollback is simply to omit this evaluation-only v3 rule; the v1/v2 rules,
v8 profile, original SRT, accepted result and private history are unchanged.
