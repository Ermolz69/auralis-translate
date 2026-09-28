# V5 JSON envelope development evidence

Status: partial `CTX-02` implementation, 28 September 2026. The profile is
experimental and **not selected for release**. This record distinguishes
machine validation from AI editorial findings; no independent Chinese/Russian
review occurred.

## Implementation and failure retention

The adapter now accepts a separately fingerprinted prompt v5 for Chinese
source, renders an envelope with one target slot, source-only context, empty
approved terms and original/masked monetary facts, and requests a JSON object.
It rejects duplicate/unknown fields, wrong slot IDs or counts, empty/control
text, changed/invented/reordered money tokens, malformed/trailing JSON and
non-Chinese source. The v5 profile permits one attempt per block. The initial
real measurements below used context disabled. A later
[scene-map slice](2026-09-28-scene-map-admission.md) admits explicit file
context but has no real quality measurement yet. Legacy v1–v4 manifests and
prompts remain separate.

The first [60-request real report](../reports/v5-envelope-placeholder-2026-09-28.json)
accepted the literal `Русский текст` for source IDs `zh08` and `zh19` in all
three repetitions. The phrase was copied from the prompt example, not from
either Chinese source. Removing that example yielded a structurally invalid
`target_slots` reply on the first request; the adapter saved no checkpoint.
That failed raw response is in the
[one-request report](../reports/v5-envelope-no-example-failure-2026-09-28.json).
The pre-inference sandbox `EPERM` and zero-request readiness timeout are
retained locally and described in the [predeclared smoke plan](2026-09-28-v5-envelope-smoke-plan.md).

The corrected v5 request uses llama.cpp's `json_object` response schema and
keeps its own strict decoder. Its manifest SHA-256 is
`df15d3e4672438a3181e9c97c582660485677c649885988ed5a9dce33119b3a7`;
`prompt_template_sha256` pins the normalized renderer/parser/schema source.
The real runtime accepted the schema; no assumption that another build does
so is made. The old failed reports remain immutable with their exact prompts
and profile hashes.

## Same-source real observations

All runs used the pinned Hy-MT2 1.8B Q4_K_M GGUF SHA-256
`dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699`,
model revision `a0c709d9fac510f2c807aa3af52872340dc37a4a`, runtime SHA-256
`6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`
and build `b10977-0ecb159c9` on Windows x64 / RTX 3070. The reports contain
CLI hashes, prompts, raw and accepted responses, request token counts, exact
times, resource samples, original/output hashes, run IDs, SQLite completion
and offline re-export hashes. The original 20-cue authored dataset SHA-256 is
`221d4e854dbfa6952785628498f0e48ea9f485b903490b9bc7c64c87fa08f0db`.
The corrected five-cue regression dataset SHA-256 is
`0f34a83d4fdc7b8f217c3be1caa21de698429f705e3dfd18497ae94cc5541e57`.
Neither dataset is natural footage, human gold or sealed holdout.

| Profile / report | Requests and files | 20-cue file times, ms | Prompt / completion tokens | Result |
| --- | ---: | --- | ---: | --- |
| Historical [v4](../reports/public-demo-fidelity-2026-09-27.json) | 60 / 3 | 10943.4264 / 11265.0707 / 11162.9706 | 2196 / 1574 | Structural pass; previous AI findings remain |
| Initial [v5 with example](../reports/v5-envelope-placeholder-2026-09-28.json) | 60 / 3 | 13250.1718 / 12691.8465 / 12830.5548 | 12003 / 2577 | Structural pass; six placeholder copies |
| [v5 schema regression](../reports/v5-schema-regression-2026-09-28.json) | 15 / 3 five-cue files | 9200.3028 / 9455.5315 / 8455.8263 | 2694 / 625 | Structural pass; zero placeholder copies; idiom issues remain |
| [v5 schema control](../reports/v5-schema-control-2026-09-28.json) | 60 / 3 | 16800.7391 / 14909.4536 / 14971.718 | 11103 / 2903 | Structural pass; zero placeholder copies; source byte-identical and all three offline exports identical |

The corrected v5 median 20-cue file time was 14971.718 ms and median
individual loopback HTTP time was 399.16545 ms. Historical v4 medians were
11162.9706 ms and 220.28525 ms. These were separate-day code/profile runs;
they are **not** an isolated speed effect of JSON schema. GPU memory samples
include other processes and cannot attribute model-exclusive VRAM. The
corrected report's sampled working-set peak was 1,551,179,776 bytes and
device-used peak was 2,309 MiB; samples were approximately one second apart.

## Source-aware AI editorial observations

The known prompt-copy regression disappeared in the corrected reports, and
the new unrelated negative control stayed `Дверь уже закрыта.` in all three
repetitions. This is a narrow observation, not a semantic pass. In the
corrected 20-cue report, `zh05` renders source `两瓶` (two bottles) as
`двадцать бутылок` in repetition 1 while preserving the monetary tokens;
`zh18` inserts `третьего дня пятницы` into a Friday deadline in all three;
`zh08` inserts `махинации` into an idiom about speaking directly in two of
three; and `zh07` loses the person/name reading in at least one repetition.
The new `v5p03` control uses `узких догмах` once for a request to answer
directly. These observations were made by an AI reading the Chinese source
and raw Russian output. They need bilingual adjudication before any scored
adequacy claim. Structural validation alone cannot catch them.

## Checks and remaining work

`task test:context-v5` passed 4 adapter protocol, 7 profile and 1 CLI
admission tests. `task test:fidelity` passed 7 legacy profile and 8 provider
protocol tests. The real Taskfile runs above passed after the retained
infrastructure and no-example failures. `task fmt` passed; `task lint` passed
with denied warnings; `task test` passed the full offline workspace suite.
`task plan:check` found 49 valid backlog tasks and linked completion evidence;
`task docs:check` found valid local links in 111 Markdown files.
`task eval:context:cases:check` passed four corpus tests and the frozen 60/240
case hash. `task site:build` and `task site:check` passed with the former 420
requests retained and four v5 evidence files checked/linked in the single
Tailwind-CDN HTML. These checks do not establish semantic quality.

`CTX-02` remains in progress. A later slice implemented scene map admission,
source-only context selection and resume identity, with mock/contract checks.
It still needs real scene-context measurement, approved term provenance,
actual rendered-token budgeting, raw rejected-attempt persistence and typed
provider outcomes. `CTX-03` and `LONG-01` own linked pieces. The current v5
no-context control is worse on several source facts than v4 and cannot replace
it. `CTX-04` needs same-source paired context/model runs and independent blind
review. No G1–G9 language, long-file or audio gate is passed here.
