# Official parallel reference v1: structural pass, semantic screen rejected

Date: 10 October 2026. Partial `EVAL-04`/`CTX-03` development evidence.
The [frozen plan](2026-10-10-official-zh-ru-reference-v1-plan.md) and exact
request identities were committed at `37f44eb` before inference. The private
Chinese-only selection and the [published bilingual PDF](https://russian.shanghai.gov.cn/cmsres/48/4855cd1c48564d2989afe7a96a6a7fd1/a238e3cbc8f237ac6d8fa6a9572406d0.pdf)
retain the pinned hashes in the plan. The PDF credits the Institute of Party
History and Literature for the Russian translation; its public availability
is not an asserted redistribution license. Private raw texts and PDF are not
part of this repository or Pages.

The first sandboxed `task eval:official-reference:probe` stopped before any
model request because `spawnSync git` returned `EPERM`. Its private
`attempt-VNEtSz/requests.jsonl` is zero bytes and remains as failure evidence.
The identical frozen task was then run once with child-process permission;
there was no inference retry. All **10/10** source-only requests returned
structurally valid Russian text. The retained private attempt is
`.cache/eval/official-zh-ru-reference-2026/attempt-6yYSEh/`.

| Measure | Observed |
| --- | ---: |
| Chats / template and tokenizer preflights | 10 / 20 |
| Reported total model tokens | 2,829 |
| Total attempt wall time | 155,515 ms |
| Sum of chat elapsed times | 51,566 ms |
| Peak sampled tracked process working set | 5,058,564,096 bytes |
| Raw response / validation failures | 0 / 0 |

The raw request journal SHA-256 is
`6a8997c45c0a1817ef88c0d89a21d469acb7ab93cca581c2b48d631372293b49`;
the complete private attempt report SHA-256 is
`4f9cfc9d5a418007367b33eb4d8c1e5c481603a28020efa17c8a0b8edc844562`.
The exact frozen request manifest SHA-256 is
`c54186f48646f35a7f7845cf88db3d1752038acdbd420f2e5d863fab2c02fd13`.
The official Russian side was extracted **after** raw replies were saved;
the private ten-pair reference record SHA-256 is
`ab1a0f9292e7245628b4646663686212e2f354dd3c74b0f293d0e180f3307f8f`.
It was derived with `pypdf` from the pinned PDF, with one matching Russian
block per Chinese selection; the private extractor SHA-256 is
`45719569aad9229761ea39f35546e7a38886eaff3b5b743a0823e0f1e9b2223a`.
Extraction has line-wrap artifacts; a lexical score against its raw text
would be misleading.

## Source-aware review and correction

An initial AI comparison noticed differences in the status of proposed and
completed actions. On checking the **exact submitted Chinese**, the source
selection itself had omitted the leading `提出` (proposed) clause from both
`research_growth` and `carbon_target`. `policy_stability` also omitted the
section heading identifying the material as a review of 2025. Their tense
differences therefore cannot be credited as confirmed translator errors.
The model's `indicator_count` answer describes implementation where the
submitted source says the draft *proposes* 20 indicators; this remains an
AI-identified concern requiring a context-complete paired check. The other
six cases include adequate core facts with stylistic and terminology
differences; no independent reviewer has adjudicated any output.

**Reject v1 as a semantic accuracy score.** Its ten valid JSON replies show
the v8 transport works on these written statements, not that the model is
accurate on policy prose or natural subtitles. The official Russian text is
a human-produced reference, not a human rating of our answers. Preserve all
ten raw replies and the rejected selection. The next v2 experiment must
include the full source modality clauses and a genuine completed-action
control, frozen before inference. Do not copy reference wording into prompts
or use this failed screen to tune v8. Product v8, accepted files and the
467-cue subtitle result remain unchanged; G3–G5 and RELEASE-05 stay open.

`task eval:official-reference:freeze`, `preflight`, `probe`, `task plan:check`
and `task docs:check` ran. The model task's first attempt failed as described;
the process-permitted identical task completed. Rollback is to omit this
evaluation-only screen and retain its private evidence.
