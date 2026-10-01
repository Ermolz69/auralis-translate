# 7B completed 263 restaurant cues after one validated retry

Date: 1 October 2026. Follows the [frozen v2 plan](2026-10-01-sethlui-json-tail-length-retry-plan.md).
This is partial `CTX-02`, `LONG-04` and `EVAL-04` engineering evidence, not a
language-quality or release gate. The same private, rights-unreviewed 263-cue
Chinese SRT and 12:18 media used in the [1.8B/7B comparison](2026-10-01-sethlui-full-v6-model-comparison-result.md)
were reused without changing source text, context, prompt, model or generation
settings. The new manifest only added the length-limit wrapper-loop retry flag
to the earlier two-attempt policy. The source, model, runtime, manifest, CLI
and build-receipt hashes are frozen in the plan. Sampling seed is unknown.

The private raw report SHA-256 is
`5bbe00880f6e22a3d9831eddf1404f7c4a51503ed29809325294dd56cd82ddd0`
at `.cache/eval/commons-sethlui-json-tail-length-retry-7b-v2/run-mHswjb/report.json`.
Run ID: `aa355012-6e25-4570-a955-435978191f2f`. The SQLite SHA-256 is
`1dcd1a18c47aad5063b7f1c082c2361f42b51da305177a8aef8e24cc9196b55f`.
The separate Russian SRT SHA-256 is
`45f140e201f5a6228a0754e48d1e2b4153a392a7869dc279768339882fa53511`;
offline re-export after server shutdown had identical bytes. The original
Chinese source and historical failed states remain untouched.

| Same 263-cue source | 1.8B original v6 | 7B original v6 | 7B retry v1 | 7B retry v2 |
| --- | ---: | ---: | ---: | ---: |
| Saved cues / result rows | 263 / 1 | 61 / 0 | 61 / 0 | 263 / 1 |
| Chat requests | 263 | 62 | 62 | 264 |
| Prompt / completion tokens | 67,934 / 9,794 | 16,248 / 2,281 | 16,248 / 2,473 | 71,212 / 10,259 |
| Translation command | 165.453 s | 79.408 s | 82.497 s | 308.207 s |
| Peak sampled process RAM / whole-device GPU | 1,559,789,568 B / 2,392 MiB | 5,071,233,024 B / 5,895 MiB | 5,097,218,048 B / 6,988 MiB | 5,072,789,504 B / 6,906 MiB |

The v2 arm made 795 proxied HTTP requests: 264 chat, 264 tokenizer and 264
rendered-template calls plus three server checks. It made one retry, at cue
62. Both requests had identical SHA-256
`3d0abf06162144d4b64da48633340020c2670b7b08904747b3252d434a9a1e7c`.
The first ended with `finish_reason=stop` but put `」}]}` inside the `text`
value. The provider journal marked it `invalid_candidate`, retained the raw
response and did not commit. The second returned a clean, normally validated
line; checkpoint 62 has `attempt_count=2`. This real run exercised the v1
completed-JSON retry branch. The new v2 `finish_reason=length` branch is
covered by deterministic provider/core tests and the archived raw shape, but
was **not triggered** in this stochastic full-file run. One completed run does
not estimate how often either failure occurs.

`task eval:natural:sethlui:v6:7b:length-tail:result:check` passed. It
reconciled every source slot, request/response body, rendered-token preflight,
usage count, all 264 chat journal rows, contiguous 263 checkpoints, the one
result row, protected SRT cue identities/timings/line counts and the offline
re-export. Peak sampled RAM was 5,072,789,504 B and whole-device GPU use
6,906 MiB across 293 samples; these are samples, not an SLA or per-process GPU
attribution. The [public summary](../reports/2026-10-01-sethlui-json-tail-length-retry-summary.json)
contains no subtitle text.

## Source-aware AI triage, no human score

On the same source, 7B keeps speaker Li Huaibo at cue 11, approximately 50
kitchen staff at 22 and the mapping of 30 dim sum to 8 desserts at 35 more
faithfully than the archived 1.8B candidate. It renders the lunch reservation
at 122 rather than copying the prior chef-skill cue. The 7B candidate still
calls the dim sum specialist a dessert specialist at 32. The exact source
restaurant name `金蜓湾` recurs, but 7B renders it as three different Russian
names at cues 130, 219 and 262. Negation at 70/80/233/254, 2006 at 215,
over 120 wines at 219 and 2,500 metres at 223 were present in the selected
AI inspection. Cue 119's `米粉` and cue 125's `小米` remain context-sensitive and
need bilingual review. These selected observations cannot be turned into an
accuracy percentage. No independent Chinese/Russian reviewer or listener has
assessed any of the 263 lines, and the source's speech alignment and subtitle
rights remain open. The output is not an approved script for Auralis dubbing.

The earlier failure reports are retained; no candidate was selected for
release, training or human dubbing. `REG-043` pins the length-limited wrapper
loop with related and negative controls. The new proper-name inconsistency
needs its own regression before future model/profile selection. G1–G9 and
A1–A6 remain open.
