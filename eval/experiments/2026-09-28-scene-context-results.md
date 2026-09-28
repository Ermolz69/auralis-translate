# Real v5 scene-context and pronoun regression observations

Status: partial `CTX-02`, `LONG-01` and `EVAL-04` development evidence,
28 September 2026. The contextual profile is experimental and not selected
for release. The semantic readings below are AI source-aware observations;
no independent bilingual or human score is claimed.

## Identity and method

The [two-scene plan](2026-09-28-scene-context-smoke-plan.md) and later
[pronoun regression plan](2026-09-28-scene-pronoun-regression-plan.md) fixed
their inputs, budgets and stop criteria before inference. Both used the
author-authored development sources and exactly the same complete SRT bytes
in the no-context and one-before/one-after scene arms. References and
expected facts were not sent to the model. The first source set has `p01`
and `s01`; the second reproduces `p01` as `r01` and adds `r02`/`r03`
related controls and `r04` explicit-plural negative control.

Both arms used Hy-MT2 1.8B Q4_K_M model revision
`a0c709d9fac510f2c807aa3af52872340dc37a4a`, GGUF SHA-256
`dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699`
and llama.cpp build `b10977-0ecb159c9`, runtime SHA-256
`6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`.
The no-context manifest SHA-256 was
`df15d3e4672438a3181e9c97c582660485677c649885988ed5a9dce33119b3a7`;
the scene profile SHA-256 was
`dc2df47b15d0eb8b7ef8d040572821ce304e5e916bb0c420ad77ee611863c68e`.
Both reports record the exact optimized CLI SHA-256
`3fe79077e714845f49baa59952f89a3dc43c49cd9cc9fba110cfd4c5e28d4dbd`.
The reported Git revision is `22cd45e`; the CLI hash binds the subsequently
implemented token-count code, which was not committed at measurement time.
The scene profile adds 64 safety tokens, a 256-token output reserve and a
2,048-token checked runtime context.

The full raw [two-scene report](../reports/scene-context-smoke-2026-09-28.json)
has SHA-256 `cd6c4e609ab62c765212a3a388c479d926971b8545a62168ba24a3e40451fdfb`.
The full raw [pronoun regression report](../reports/scene-pronoun-regression-2026-09-28.json)
has SHA-256 `ccb56c18632982d5ba841185c31e033b82ecc5a213e1048ee443bca766a2cc2b`.
They retain exact request envelopes, raw chat responses, accepted target
texts, source/profile/CLI/runtime hashes, tokenizer counts, server usage,
timings, status, offline exports and approximate resource samples.

## Observed target translations

| Case | Source context → target | No context | Same-scene context | Source-aware observation |
| --- | --- | --- | --- | --- |
| `p01` | `哥哥刚下车。` → `到了。` | `Пришло.` | `Приехали.` | Context changed the wording but still lost singular older brother. |
| `s01` | `你看见他了吗？` → `没有。` | `Нет.` | `Нет.` | No observed target change; fuller reply was not required structurally. |
| `r01` | exact `p01` scene | `Пришло.` | `Прибыли.` | Singular actor again became plural. |
| `r02` | `姐姐刚下车。` → `到了。` | `Пришло.` | `Приехали.` | Singular older sister became plural. |
| `r03` | `弟弟刚下车。` → `到了。` | `Пришло.` | `Приехали.` | Singular younger brother became plural. |
| `r04` | `两个哥哥刚下车。` → `到了。` | `Пришло.` | `Прибыли.` | Plural is admissible here; this control prevents a blanket singular rule. |

The three new singular contextual outputs demonstrate a reproducible
actor-number defect in this setup. A translator may phrase arrival without
an explicit pronoun, but should not change an explicitly singular actor to
plural. This is a source-aware AI finding, still pending human adjudication.
The no-context arm also produced poor impersonal wording, so this probe
does not establish that removing context is the right candidate.

## Structural and resource observations

The first run made 10 model requests and 32 total loopback requests; the
second made 24 and 72, respectively. All four plus eight files validated,
preserved original SRT bytes, and re-exported byte-identically from frozen
state after the server stopped. No request or run failed. In the second
report the baseline used 1,994 prompt and 378 completion tokens across 12
chats; the scene arm used 2,475 prompt and 375 completion tokens across 12.
All scene preflight `/tokenize` counts equaled the corresponding server
`usage.prompt_tokens`; the largest measured prompt had 227 tokens, below
the 1,728-token post-reserve ceiling. No trimming was needed in this real
sample. Unit tests exercise deterministic removal of farthest context.

The second run's sampled working-set peak was 1,556,480,000 bytes and GPU
device-used peak was 2,292 MiB. Sampling was approximately once per second;
GPU usage includes other processes and does not measure model-exclusive
VRAM. File wall times and per-request timings are in the raw reports; these
small sequential runs do not isolate a speed effect from context.

## Gate disposition

`task eval:context:scene:check` passed script syntax. The bounded real
`task eval:context:scene:smoke` and
`task eval:context:scene:regression` runs completed within their declared
request budgets. `task test:context-v5` passed six adapter, eight profile
and two CLI cases. `task fmt`, `task lint` and full offline `task test`
passed. `task plan:check` passed 49-task dependency/evidence validation,
`task docs:check` passed local links in 116 Markdown files, and
`task site:build`/`task site:check` passed with all 420 historical requests
retained. These checks establish code and evidence integrity, not translation
adequacy.

`REG-002` remains open. `task eval:regression:check` pins the raw failed
outputs, two related singular controls, explicit-plural negative control,
source-only prompts, exact source identity and tokenizer/usage agreement.
Actual rendered-token admission works in this measured 2,048-token setup,
but `LONG-01` still needs target/batch sizing and stress cases. `CTX-02`
still needs approved terminology, raw rejected-attempt persistence and
independent source-aware review. No G1–G9 or A1–A6 gate is passed by these
small authored scenes.
