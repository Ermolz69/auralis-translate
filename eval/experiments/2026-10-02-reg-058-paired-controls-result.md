# REG-058 paired controls: failed harness retained, corrected real screen

Date: 2 October 2026. Development cases only; no closed holdout or
independent Chinese–Russian rating. The owner declined volunteer contact.
The six positive and six negative Chinese controls were authored and frozen
in [REG-058](../regressions/v8-natural-7b-semantic-risk-v1.json) before
these runs. Expected meanings were never sent to either model. Both arms
used the same target IDs, source-only neighbor context, original v8 prompt
and one-target settings. Each arm had one sample per control, zero retries.
Model GGUF SHA-256: 1.8B
`dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699`,
7B `9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b`;
runtime `6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`.
The [v2 plan](2026-10-02-reg-058-paired-controls-v2-plan.md) pins manifests,
request budget and hashes. Run code commit: `57c5d6f27b9e37231aa9c321fde416530b71c32f`.

## Retained failed screen

The first [predeclared run](2026-10-02-reg-058-paired-controls-plan.md)
made 24 real chats, but the harness replaced `source_original` and left
`source_for_translation` from the natural source. All 24 requests therefore
tested the wrong target. The [source-free failure record](../reports/2026-10-02-reg-058-paired-controls-invalid.json)
pins private report SHA-256
`d9a9229940e9474ab6cc75a25819300ac5bd7a76bde4fcbe8114196faf4eade2`;
its raw requests and replies remain under the ignored cache. No v1 output
is counted as a control translation or compared for quality. REG-060 adds
the minimal mismatched-field reproducer, two valid related controls and
two rejected negative controls. The corrected experiment has a distinct
ID, directory and request hashes.

## Corrected v2 observations

`task eval:regression:reg058:v2:preflight` checked all pinned model,
manifest, runtime and request identities. One
`task eval:regression:reg058:v2:probe` completed 24 chats and 48 rendered
prompt/tokenizer preflights in 28,118 ms. The
[source-free result](../reports/2026-10-02-reg-058-paired-controls-v2.json)
pins private report SHA-256
`a855c4d3d00aae4281ed5fa5d3b1f6b61b8e8ab600dda25f9eee9f100f6c126b`.
`task eval:regression:reg058:v2:check` replays each recorded request from
its original natural v8 request, replacing only the model alias and **both**
target text fields, then checks raw response hashes, exact target identity,
preflight hashes and token counts. Both target fields equal the authored
Chinese in all 24 requests. All outer model replies were parseable and
stopped normally; the 7B platform-action candidate nevertheless contains
a leaked JSON tail, so outer parsing is not acceptance.

| Arm | Chats | Prompt/completion tokens | Sum of chat latency | Sampled server working set | Sampled device GPU use |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1.8B | 12 | 3,244 / 482 | 5,375 ms | 1,542,430,720 bytes | 3,741 MiB / 8,192 MiB |
| 7B | 12 | 3,396 / 503 | 14,405 ms | 5,063,041,024 bytes | 7,263 MiB / 8,192 MiB |

GPU use is device-wide; working set is sampled, not an isolated peak.
Raw responses, tokenization and sampled resources are in the private
journal. The public report includes each authored expected English
meaning, Russian candidate, hashes, token usage and elapsed time.

**AI-only post-response reading, not an independent score:** the 7B
correctly distinguished handheld from tablet and single-core from a
processor module in these controls, but called a multi-core test
“multithreaded”, translated the mouse-pad positive as mouse stands, and
returned a leaked JSON suffix for the platform-action positive. Its
negative controls for multiprocessor, chart vertical axis, three literal
presses and mouse stands were distinct; that contrast makes the positive
failures more specific. The 1.8B turned the handheld positive into a
tablet and the tablet negative into a smartphone. It omitted the vertical
axis in the chart control and rendered the platform idiom literally;
several replies also have Russian grammar or mixed-language defects.
These are individual observations in one-sample authored cases, not a
12-case accuracy percentage or a population estimate. In particular,
positive/negative pairs do not show that the natural 268-cue draft is
acceptable. The already implemented leaked-JSON guard is now exercised
with the exact new 7B candidate in the v7/v8 provider test.

The current natural 7B draft remains `needs_review`: 43 selected cues
had AI triage, six high-confidence meaning risks, zero human-reviewed
eligible cues. The source's rights and alignment are unresolved. These
control results narrow the semantic risks but do not close REG-058,
G3–G5, A1–A6 or RELEASE-05. Next model work should use a frozen measured
term/context change and repeat the *full* long-file source with the same
audit windows, including seams, start/middle/end, numbers and negation.
No further parameter search or retry is justified from this single
screen alone.
