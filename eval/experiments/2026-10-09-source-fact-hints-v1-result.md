# Source-fact hints v1: bounded 7B candidate rejected

Date: 9 October 2026. This is the result of the predeclared
[36-request source-fact screen](2026-10-09-source-fact-hints-v1-plan.md),
not an accepted v8 product change, full-file pass, holdout score or human
language review. The same original-platform 467-cue Vivo SRT and five known
natural fact windows were used in both arms. The separate
[scene selection](2026-10-09-youtube-chinese-scene-selection-result.md)
keeps source rights and human speech alignment open.

## Frozen identities and execution

The source SRT SHA-256 is
`b100803367b95fa55fc638b1ff39a0abfa0d5b8183ebe58d58b1a87242d9d8c4`.
The 7B Q4_K_M GGUF SHA-256 is
`9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b`;
manifest SHA-256 is
`c287c53efbb4ce78471b64648ea3dd2f521363df0e168b7a61df1fdd6ae0479a`,
and llama-server executable SHA-256 is
`6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`.
The frozen [request schedule](2026-10-09-source-fact-hints-v1-freeze.json)
has SHA-256 `c72cee33e2065e8c4a508e5174478f2e968a6766869c9217d05d6c14545f4329`.
The extractor SHA-256 is
`914206f782bf3b0a667d79c4d8ffa25ac22b2d87c58b5e34debab719079bcad1`.
Inference ran from clean commit `5b25b7735fe91c447fc7b9f28f04d6a9c28094f6`,
seed 101, zero retries. The JSON-tail product test and reporting code were
added only after the raw calls and cannot alter their inputs or outputs.

The single local server answered **36/36 chats** and **72/72** template and
tokenizer preflights in 199,462 ms wall time. Total prompt plus completion
usage was 19,575 tokens, below the 100,000-token cap. Baseline 18 chats:
6,852 prompt and 2,448 completion tokens, summed HTTP chat time 91,801 ms.
Candidate 18 chats: 7,846 prompt and 2,429 completion tokens, summed HTTP
chat time 92,357 ms. The candidate added 994 prompt tokens; the 556 ms
summed chat-time difference from one seed is not a latency estimate.
Sampled process working set peaked at 5,107,417,088 bytes; sampled
device-wide GPU use peaked at 7,334 MiB and includes other applications.
The private raw report SHA-256 is
`0334451b07855052aa4a316b08e81d4a94d1d36fe857e20c39fe05dbd95e8729`,
and the complete private request/reply journal SHA-256 is
`72e52f740ffa1b4dce7e88168a6872eb2687ab44e1f39fd19e0316a10b8f767f`.
All exact request/response hashes, cue IDs, usage and times are in the
[source-free machine report](../reports/2026-10-09-source-fact-hints-v1.json).

## Paired observations and review provenance

All 36 direct chat replies parsed as JSON objects with the requested IDs.
This narrow direct-API shape count is **not** a product acceptance count:
one candidate contains JSON wrapper punctuation inside every target string.
The existing v7/v8 provider rejects braces before journal acceptance, as
confirmed by `task test:long-batch-v8` with exact object-boundary and
array-terminator controls. That raw candidate remains retained and invalid.
The [separate AI source-aware review](../reports/2026-10-09-source-fact-hints-v1-ai-review.json)
is not a human score; human Chinese–Russian ratings remain **0**.

| Known natural window | Paired finding | Decision |
| --- | --- | --- |
| Cue 60, 9400 generation | Both avoid an invented first ordinal; the candidate alters brand wording nearby | No established quality gain |
| Cue 276, 36-month planning | Both still reverse the lead relation. The candidate also leaks JSON wrapper fragments into all four target strings | `REG-069`, product guard contains it |
| Cue 280, thousand-person team | Both still treat the investment verb as funding rather than the later team referent | Existing `REG-066` remains |
| Cue 328, after-midnight time | Baseline keeps roughly 01:00–02:00; candidate moves it to 11:00–12:00 at night | New major `REG-070` |
| Cue 466, future products | Candidate improves future modality, but speaker/recipient agency remains uncertain | `needs_review`, no promotion |

One authored 9400 digit-one control changed from an invented first-generation
ordinal to a current 9400 model. Explicit after-start timing, both money and
team, explicit late-evening time, present product availability and the quoted
foreign word were preserved in their controls. An explicit first-generation
control changed to “first series”; it remains a terminology uncertainty.
Five no-hint pairs have byte-identical requests in both arms and cannot be
counted as treatment gains. The original three-slot tail repeats the natural
cue-466 request and is not independent. Authored four-slot tail controls
returned all IDs in this one 7B screen; the older 1.8B shifted-tail failure
is not repaired by this observation.

The exact new failures and additional related/negative cases are retained
in [REG-069](../regressions/reg-069-fact-hint-json-wrapper-leak-v1.json)
and [REG-070](../regressions/reg-070-fact-hint-midnight-clock-shift-v1.json).
Future model screens of the pending authored controls require a new frozen
budget and must not use a closed holdout as prompt input.

## Decision, checks and rollback

**Reject the source-fact hint candidate.** A new natural major clock error
and a new product decoder rejection fail the declared no-new-major rule even
though one authored case improves. The extractor remains evaluation-only;
the production v8 prompt/profile and both previous full-file SRT drafts
are unchanged. No 1.8B or whole-file candidate was launched from this hint.

`task eval:source-facts:unit` passed seven deterministic tests before
inference. After inference, `task eval:source-facts:check` rehashed all 36
raw replies, 72 preflights, exact paired requests and five abstentions.
`task test:long-batch-v8` passed 10 provider, 16 profile and five CLI
tests, including the JSON-leak rejection. Regression catalog, backlog,
site and release-audit checks are recorded in the subsequent catalog/audit
commit; their success does not raise a language-quality score.

Rollback is to continue the unchanged v8 profile in a fresh run, preserving
the original SRT, both drafts, failed raw journal and newer SQLite records.
Do not downgrade a database in place. The next quality work should use
source-derived **post-answer fact diagnostics or fail-closed review** for
timing/agency, with a new bounded paired screen; prompt hint wording has
not met the admission rule. Source rights, independent bilingual review,
full-file quality, G3–G5 and RELEASE-05 remain open.
