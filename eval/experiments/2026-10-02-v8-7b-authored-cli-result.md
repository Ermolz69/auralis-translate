# Real 7B v8 CLI completes the four-cue authored scene

Date: 2 October 2026. Frozen [plan](2026-10-02-v8-7b-authored-cli-plan.md);
[machine report](../reports/2026-10-02-v8-7b-authored-cli.json).
The checked 7B v8 manifest is distinct from the 1.8B v8 manifest but
uses the same target-first prompt template and four-target limit. The
source, model, runtime, manifest and release-CLI SHA-256 identities are
in the plan and checked by `task eval:long:v8:7b:authored:check`.

One real Hy-MT2 7B Q4_K_M server and fresh durable CLI state produced a
complete four-cue Russian SRT in one validated batch. The source SHA-256
remained `ad88b2d2f96b153d5d8880175b321167263d7abaae48ca693d89b925459bc8a7`.
The SQLite journal has two successful template/tokenizer preflights, one
raw chat response, one `validated_batch` row, one durable checkpoint and
one exported result with review state `needs_review`. There is no partial
publication or silent replacement of the 1.8B profile. The 7B output
SHA-256 is `d6afd24869bd78fb402a57544b842fa24685f2593d2dd10e6f7269a8da1f77f2`.
The ignored private report SHA-256 is
`faeac62597857b05ffa8783dd5fcf2d8e292ceddbb41645baa8c351bc1fadba5`;
it retains the exact raw request/response, accepted text and resource
samples. No Russian reference entered the prompt.

| Cue | 1.8B v8 batch-four candidate | 7B v8 batch-four candidate |
| ---: | --- | --- |
| 1 | `Менеджер Ванг сказал, что завтра не пятница.` | `Менеджер Ван сказал, что завтра не пятница.` |
| 2 | `Этот билет стоит 10 юаней, не нужно платить 100 юаней.` | `За этот билет нужно заплатить 10 юаней, а не 100 юаней.` |
| 3 | `Был ли Ли Сяо передал ключи менеджеру Вангу?` | `Отдал ли Сяо Ли ключи менеджеру Вану?` |
| 4 | `Нет, он оставил ключи на столе.` | `Нет, он оставил ключи на столе.` |

By source-aware AI inspection, the 7B cue 3 preserves Xiao Li and forms
a grammatical question, addressing the specific 1.8B development defect.
Both models preserve the core negation, amounts and response continuity in
this short scene. The 7B raw response used protected money placeholders;
the accepted SRT restored exact `10` and `100` tokens. This is one authored
source, so it is not a long-file semantic quality result. No independent
Chinese–Russian person reviewed it; both SRTs remain `needs_review`, and
neither is an approved spoken script. Name spelling for 王 still differs
across model runs and needs a reviewed source-scoped form.

The 7B chat used 451 prompt / 145 completion tokens and 3,986 ms HTTP;
the complete CLI command took 29,900 ms and the harness 35,915 ms. The
earlier 1.8B four-target run used 467 / 158 tokens, 1,549 ms chat and
7,880 ms CLI. These are separate one-shot server sessions with different
model loading/hash costs, so no general speed comparison is claimed.
Six sparse samples observed at most 5,034,844,160 bytes of 7B server
working set and 7,212 MiB device-wide GPU usage on an 8 GiB RTX 3070;
they are not isolated peaks or portable headroom. Next: bounded natural
long-file v8 7B scene/seam test and reviewed name terminology. G3–G9/
A1–A6, human meaning review, listening and clean Windows target remain open.
