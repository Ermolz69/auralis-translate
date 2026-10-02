# REG-058 provisional manufacturer terms: positive repair, negative contamination

Date: 2 October 2026. The [frozen plan](2026-10-02-reg-058-provisional-terms-v1-plan.md)
and [source-free paired report](../reports/2026-10-02-reg-058-provisional-terms-v1.json)
cover ten authored development controls and two prompts per control. Code at
inference: `c8992ef22d00d3280073ce3e68bdf3ab56f2d0c1`. The real 7B
Q4_K_M model produced 20/20 structurally accepted candidates after 40/40
template/tokenizer preflights, with zero retries. The unchanged source-only
context, target IDs, model, parameters and 2,048-token budget were common to
both arms. Only one provisional ASUS term note was added. Both target source
fields were replaced consistently. The expected full-sentence meanings were
absent from every request; the two disclosed manufacturer term forms were
present in the terms arm. There was no holdout or independent reviewer.

Private raw request/response report SHA-256:
`dbd76bfe2214add54ab75ac34251ddb7aba8a343284d067630a7eb194778b283`.
Public report SHA-256:
`300bc148566f8e7d7cd813863feb7c4b7de2a62311d72b8851aeb43ae0c72ba6`.
`task eval:regression:reg058:terms:check` recomputes the exact requests
from the archived natural prompts and frozen controls, hashes the raw replies,
checks target fields and replays rendered-template/tokenizer preflights.

| Ten paired controls | v8 baseline | Provisional terms |
| --- | ---: | ---: |
| Structurally accepted | 10/10 | 10/10 |
| Prompt / completion tokens | 2,899 / 501 | 3,609 / 521 |
| Summed chat HTTP latency | 8,716 ms | 8,988 ms |

Total wall time was 23,767 ms. Maximum sampled model-process working set was
5,065,895,936 bytes; whole-device GPU maximum was 7,299/8,192 MiB and
includes other users. This single paired run cannot estimate population
quality or latency tails.

## Separate AI source-aware reading

The term arm corrected the known positive `多核` test to a multi-core test and
`鼠标垫` to a mouse pad. It kept the two-point multi-core versus multi-thread
contrast and the twenty-yuan pad versus stand relation. It also introduced
material errors into controls that were correct in the baseline:

| Control | Baseline candidate | Terms candidate | AI-only finding |
| --- | --- | --- | --- |
| `multiprocessor_negative` | “Это система с несколькими процессорами.” | “Это система с многоядерным процессором.” | Changes processor count to core count; the Chinese target has no `多核`. |
| `mouse_stand_negative` | “Мы также продаём подставки для мышей.” | “Мы также продаём коврик для мыши.” | Replaces a stand with a pad; target has no `鼠标垫`. |
| `stand_only_new` | Stand out of stock; do not call it a mouse pad | Says a pad is out of stock and should not be called a pad | Loses the stand referent and makes the negation incoherent. |
| `multicore_extra` | Eight cores on one processor | “восемь многоядерных ядер” on one processor | New nonstandard and misleading core wording. |

These are AI assessments of visible authored cases, not independent bilingual
ratings. The exact candidates and expected meanings for all twenty rows are
in the JSON report. The two baseline known positives were wrong; the term
hint's local gain is real on these sampled controls but does not offset
negative contamination. The predeclared advancement rule required both
positive repairs **and** no material error in known negatives and new
contrasts. It failed. **Reject this term note; keep product v8 unchanged and
do not run the 268-cue file with it.** The next design must enforce target
scope or separate term evidence from source-only context, then face new
untested related controls. Do not label the manufacturer evidence
`approved_terms` or treat these exposed terms as a blind terminology score.

The owner declined volunteer outreach. There are zero human Chinese–Russian
ratings, no licensed/aligned long source for acceptance, and no approved
spoken script. G3–G9 and A1–A6 remain open.
