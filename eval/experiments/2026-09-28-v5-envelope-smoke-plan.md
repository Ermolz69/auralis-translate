# Predeclared v5 envelope smoke

Frozen before inference on 28 September 2026. Tasks: `CTX-02`, `EVAL-02`.
This is a real-model engineering smoke, not a context or language-quality
comparison and not a release gate.

## Question and fixed inputs

Can the pinned Hy-MT2 1.8B Q4_K_M model return structurally valid single-slot
v5 JSON on the existing 20 authored Chinese development lines, with ordered
monetary markers preserved? The v5 profile has context and terms disabled, so
this run isolates the new request/response envelope. It cannot show that source
scene context improves meaning. The [v4 real baseline](2026-09-27-chinese-currency-protection.md)
uses the same authored dataset but is historical; no matched speed or quality
claim will be made from it.

- Dataset: `eval/corpora/public-demo-v1.json`, SHA-256
  `221d4e854dbfa6952785628498f0e48ea9f485b903490b9bc7c64c87fa08f0db`;
  development split, authored examples with proposed references excluded from
  inference. No sealed data.
- Model: `Hy-MT2-1.8B-Q4_K_M.gguf`, freshly checked SHA-256
  `dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699`,
  revision `a0c709d9fac510f2c807aa3af52872340dc37a4a`.
- Runtime launcher SHA-256
  `6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`;
  declared build `b10977-0ecb159c9`. The report will record actual runtime,
  CLI/profile hashes, server observations and sampled resources.
- Experimental profile file SHA-256
  `eb46696ca0b710bdaf76749e19c579dff70bd8608590460ef37f7cbd8424a714`:
  prompt v5, 2,048 context tokens, 256 maximum generated tokens per request,
  temperature 0.7, top-p 0.6, top-k 20, repeat penalty 1.05, one attempt per
  block and 120-second request timeout. No scene context or approved terms.
- Local Windows x64 RTX 3070 only. No paid API, rented device or simultaneous
  audio experiment. `task eval:context:v5:smoke` builds the release CLI and
  invokes the existing retained-attempt benchmark in its own ignored run root.

## Budget and stop rule

Run order is three fresh SQLite/output states against one persistent loaded
server. At most 20 requests per state and 60 total, with a maximum of 15,360
generated tokens by configured request ceilings. The benchmark stops on the
first failed file, timeout or structural rejection; it retains all attempted
raw responses, the CLI error, timestamps, prompt/code hashes and resource
samples in `benchmark.json` even on failure. Do not change the prompt or retry
the same run to obtain a favorable answer. A proposed correction requires a
new profile/experiment identity and preservation of this failure.

The first invocation was denied by the process sandbox before inference. The
second started the real server, which logged readiness on loopback, but the
health probe timed out after 180 seconds with zero model requests; its retained
report is `.cache/eval/context-v5-smoke/run-vgzhN4/benchmark.json`. One
infrastructure diagnosis is admitted: keep the same model/profile/dataset,
record the last health response/error and cap readiness at 30 seconds. This
does not count as a translation result or permission to retry model outputs.

Acceptance here is exact structural admission and source byte preservation
for completed files. Bilingual adequacy, grammar, context benefit and holdout
accuracy remain unmeasured. AI editorial observations must be labelled as such.
