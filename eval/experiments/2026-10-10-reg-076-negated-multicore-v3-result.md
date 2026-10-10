# REG-076 v3: exposed negated-core note rejected after 120 real replies

Date: 10 October 2026. Tasks: `CTX-03`, `EVAL-04`, `LONG-04`.
The [committed plan](2026-10-10-reg-076-negated-multicore-v3-plan.md)
at `25e5bb9` and [120-request freeze](2026-10-10-reg-076-negated-multicore-v3-freeze.json)
at `bae2dfc`, SHA-256
`9a8a91ec5d91f2c6338b181f4272854b968f6559d973bf72944b51b0c8c7d8a7`,
preceded all inference. The run used a clean committed Translate checkout
at `bae2dfc`. Original Chinese SRT SHA-256
`b100803367b95fa55fc638b1ff39a0abfa0d5b8183ebe58d58b1a87242d9d8c4`,
7B Q4_K_M GGUF SHA-256
`9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b`,
llama-server SHA-256
`6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`
and v8 manifest SHA-256
`c287c53efbb4ce78471b64648ea3dd2f521363df0e168b7a61df1fdd6ae0479a`
were checked before the single model attempt. The v2 failed result and
REG-076 pack remained immutable.

The same 20 exposed development inputs used exact source/context/response
schema and decoding in both arms, with seeds 101/202/303 and alternating
arm order. Candidate requests without applicable source notes were
byte-identical to v8 in 30 of 60 cells; the other 30 added target-scoped
technical sense notes. No expected Russian sentence, human rubric or
closed holdout was sent to the model. The one run produced **120/120
structurally valid raw and accepted replies**, 240/240 rendered
template/tokenizer checks, 33,890 combined model tokens and zero model
retries or HTTP/validation failures in 204,044 ms. The private report
SHA-256 is
`c57661ee9e6bce593694bbcb906ef2a0856ae0d7b1edcb877e5389817c5e7718`;
the private raw journal SHA-256 is
`f5b34cae06fb23f8eb7a484242c3aaf6728e4283e18ad1fe543ae2de1301ecf3`.
The [source-free public machine report](../reports/2026-10-10-reg076-v3.json)
SHA-256 `f16cea2e2840d87e3f1230ae9cf85e2fd80901fc3e6bb90df738ce75bc63cecb`
pins every request, raw HTTP response, accepted-text hash, token count,
preflight and chat duration. Its independent checker rereads all 120
private rows and every pair.

| Matched arm | Chats | Prompt tokens | Completion tokens | Summed chat HTTP time |
| --- | ---: | ---: | ---: | ---: |
| v8 baseline | 60 | 12,795 | 3,272 | 55,385 ms |
| Scoped candidate | 60 | 14,388 | 3,435 | 58,879 ms |

Forty five-second samples had no sampler errors. Maximum sampled server
working set was 5,065,822,208 bytes; maximum **whole-device** RTX 3070
memory use was 7,274 MiB of 8,192 MiB. Other applications were present,
so this is neither isolated model VRAM nor a release resource bound.
The local CIM RAM query was denied; no RAM-availability number is inferred.
These short-case timings are not a complete-file throughput measurement.

The separate [source-aware AI review](../reports/2026-10-10-reg076-v3-ai-review.json)
covered all 60 source/seed pairs. It marked 13 major fact-error baseline
cells and 4 candidate cells **within this selected exposed set only**;
there are zero human Chinese–Russian ratings and no representative error
rate. Two of three natural technical facts improved in all three seeds;
the third was already correct and candidate wording became longer.
The original three-chip negated-multi-core case improved in all three
candidate seeds, while two of three baseline seeds also recovered without
the note. The connected two-independent-chip control **failed in all
three candidate seeds**: it still denied a multi-processor chip, sometimes
adding cores without preserving the exact single-multi-core contrast.
Another new control lost multi-core within each chip in one candidate
sample even though its request was byte-identical to baseline; this is
sampled variability, not evidence that the scoped note reached that cue.
All six replies to the multiple-processor/single-core control retained
the main facts but used a Russian one-core agreement error.

The frozen shortlist rule required every new related/negative control
to preserve its facts in every repetition. Only 14/18 candidate cells
did so. **Candidate rejected; product v8 and both complete 467-cue
`needs_review` SRTs stay unchanged.** No new long-file translation,
checkpoint or audio run follows. [REG-077](../regressions/reg-077-chip-core-contrast-v1.json)
retains two minimal semantic failures and six new controls;
[REG-078](../regressions/reg-078-one-core-russian-agreement-v1.json)
retains the grammar failure and six new controls. The controls have no
model outcomes yet. `task eval:reg076:v3:unit`, `freeze`, `preflight`,
`probe`, `report`, `check`, `review:check` and `regressions:check` passed
in their respective phases; the source-aware judgments are AI-only.
Rollback of any experimental use is a fresh unchanged-v8 run, retaining
all raw failures and previous accepted results. G3–G5, A1–A6 and
RELEASE-05 remain open.
