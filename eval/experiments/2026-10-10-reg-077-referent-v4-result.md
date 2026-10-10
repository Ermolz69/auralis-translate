# REG-077 v4: source relation card rejected after 192 real replies

Date: 10 October 2026. Tasks: `CTX-03`, `EVAL-04`, `LONG-04`.
The [plan](2026-10-10-reg-077-referent-v4-plan.md) at `dac038e` and
[192-request freeze](2026-10-10-reg-077-referent-v4-freeze.json) at
`ef1742a`, SHA-256
`95d3548ff895c9da654bc646aa3dac44a505f0f9a8896843f164bc204cea42dd`,
preceded all inference. The one run used a clean committed Translate
checkout at `ef1742a`. The original Chinese SRT SHA-256 was
`b100803367b95fa55fc638b1ff39a0abfa0d5b8183ebe58d58b1a87242d9d8c4`;
7B Q4_K_M GGUF
`9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b`;
llama-server
`6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`;
v8 manifest
`c287c53efbb4ce78471b64648ea3dd2f521363df0e168b7a61df1fdd6ae0479a`.
All inputs are exposed authored/natural development material, not a
sealed holdout. No reference Russian sentence or reviewer rubric went to
the model. Both arms used the same target/context/schema and decoder
parameters, seeds 101/202/303, with alternating order. Exactly six of
96 candidate requests got the new source relation card; 63 candidate
requests were byte-identical to v8. Of 120 prior v3 cells, 117 kept both
request and accepted-output hashes; the other three were the deliberately
changed candidate contrast. No product profile or source changed.

The one attempt produced **192/192 structurally valid raw and accepted
replies**, 384/384 template/tokenizer preflights, 52,206 combined tokens,
zero retries or HTTP/validation failures in 191,083 ms. Private report
SHA-256: `1cee30df4e89a518007c3885b6d5668f68bf4c2aee4b44de4f3f36568242267c`;
private raw journal SHA-256:
`eb246cbe4431f972673b2898c80cfabb93b881f305dc3181ac4c326d9c27d5f0`.
The [source-free machine report](../reports/2026-10-10-reg077-v4.json)
SHA-256 `1cd09c57dcad44e7eadcc1357faaa6cb1d901a620a129fdc845ed6bb6e17e8ae`
pins every request, raw HTTP response, accepted-text hash, token count,
preflight and elapsed time. Its checker replays all private rows.

| Matched arm | Chats | Prompt tokens | Completion tokens | Summed chat HTTP time |
| --- | ---: | ---: | ---: | ---: |
| v8 baseline | 96 | 19,980 | 4,976 | 83,316 ms |
| Scoped candidate | 96 | 22,161 | 5,089 | 85,187 ms |

Thirty-seven five-second resource samples had zero sampler errors. The
maximum sampled server working set was 5,061,644,288 bytes and maximum
**whole-device** RTX 3070 memory use was 5,713 MiB of 8,192 MiB. Other
applications may use the device; this is neither isolated model VRAM nor
a release hardware bound. This short-case timing does not measure
complete-file throughput.

The separate [source-aware AI review](../reports/2026-10-10-reg077-v4-ai-review.json)
covered all 96 source/seed pairs, including inherited verification of
117 byte-identical prior answers. On the two card-exposed contrasts, the
candidate said *multi-processor chip* where the Chinese source denies one
*multi-core chip* in **all six replies**. Across all twelve new
REG-077/078 controls, 33/36 candidate cells passed the primary fact;
the three failures were the card-exposed new contrast. Across the
whole selected exposed set, AI marked 16 baseline and seven candidate
major fact-error cells; these are **not** representative quality rates.
The new REG-078 controls expanded the shared Russian *один ядро*
agreement error from the prior six to 18 observed cells, while a
distributive *по одному ядру* case was grammatical. There were **zero**
independent Chinese–Russian or Russian listening judgments.

The frozen shortlist rule required both card-exposed contrasts to
preserve the negated referent in all repeats. It failed 0/6. **Candidate
rejected; product v8, both complete 467-cue `needs_review` SRTs, SQLite
checkpoints and Auralis audio remain unchanged.** No new long-file
translation or TTS follows. [REG-079](../regressions/reg-079-referent-card-recurrence-v1.json)
retains the new minimal relation failure and six new controls;
[REG-080](../regressions/reg-080-one-core-agreement-expansion-v1.json)
retains the expanded grammar failure and six new controls. Their new
controls have no model outcomes yet. `task eval:reg077:v4:unit`, `freeze`,
`preflight`, `probe`, `report`, `check`, `review:check` and
`regressions:check` passed in their respective phases. Rollback of any
experimental use is a new run with unchanged v8 while retaining all
failed raw evidence. G3–G5, A1–A6 and RELEASE-05 remain open.
