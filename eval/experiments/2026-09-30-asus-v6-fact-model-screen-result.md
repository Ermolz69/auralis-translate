# Paired ASUS v6 fact and terminology screen

Date: 30 September 2026. The [frozen plan](2026-09-30-asus-v6-fact-model-screen-plan.md)
preceded inference at commit `b8776ba055bc9b45371fa12baed4ca8e4fe0b882`.
The first sandbox launch stopped at `spawnSync git EPERM` **before any
model request or server start**. The ignored private failure report is
`.cache/eval/commons-asus-v6-fact-model-screen-v1/run-w0QpqJ/launch-failure.json`,
SHA-256 `f77a71e8a0e913511238c8924457880080e03835247ae54d94badc49c97a38f1`.
The one allowed zero-chat infrastructure retry then completed in
`.cache/eval/commons-asus-v6-fact-model-screen-v1/run-bWDBNw`.

The retained report SHA-256 is
`23a12aa953b0e1cb43e0dfaec7061672c979d0f24e3a7fa04639b921ab25fdf9`;
the private raw JSONL journal SHA-256 is
`8bb9e021adea11cf09394b470c00afa556959be4d9a0baf47c37d8557163ea2f`.
`task eval:natural:asus:v6:fact-screen:check` rehashed all 64 requests,
responses and model-paired prompt identities. The same seed 101 and v6
target-constant template were used for both Hy-MT2 Q4_K_M sizes, with only
the model alias changed. Runtime SHA-256 was
`6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`;
1.8B model/profile hashes were `dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699`
and `b30546f228ba230364ba79edae55456d62e7d7c5010e56fef38464c3531089c5`;
7B model/profile hashes were `9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b`
and `e7e2d7745cb283a88984da202eb511f0144b2bc51bc6eb01727515a51e7aa06f`.

| Model | Paired cases | Outer JSON/target ID | Prompt/completion tokens | Chat HTTP total | Tracked server working set peak | Whole-device GPU peak |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1.8B | 32 | 32/32 | 7,168 / 1,409 | 10,893 ms | 1,547,878,400 B | 2,004 MiB |
| 7B | 32 | 32/32 | 7,219 / 1,470 | 24,188 ms | 5,062,770,688 B | 5,522 MiB |

The 45,367 ms wall time includes two sequential server starts, 64 chats
and persistence. Memory was sampled only three times for 1.8B and six for
7B, so peaks are observed lower bounds on an active machine. The 11
natural cases have exact archived source and scene context; 21 authored
related/negative controls use no scene context. References and expected
meaning were absent from all requests. This known development sample does
not estimate generalization or justify a model choice.

AI source-aware triage of the **11 natural pairs** found:

| Focus cue(s) | 1.8B | 7B | Source-aware observation |
| --- | --- | --- | --- |
| 2–3 | Tablet at 2, category lost at 3 | Tablet at 2, handheld category at 3 | Neither consistently preserves the handheld device across adjacent cues. |
| 12 | 608 g and 60 g | 608 g and 60 g | The archived full 1.8B pass changed grams to gigabytes; this one-seed replay did not. |
| 20 | Shoulder/trigger terms are confused | Shoulder buttons closer, Hall trigger term dubious | Technical controls still need a reviewer and approved terminology. |
| 91 | Smartphone-specific chip | Portable-device chip | 7B preserves this product class in this request. |
| 133 | Battery life remains deficient | Battery life needs improvement | Both preserve the unfavorable direction here, unlike the archived full-run 1.8B error. |
| 142 | Single-chip/garbled term | Single-chip term | Both lose the source's single-core performance referent. |
| 226 | Disabling thread *counting* | Unnatural superthreading term | Neither provides an approved hyperthreading translation. |
| 227 | 9W remains and four cores | 9 watts plus `」}]}]}` text tail | 7B returned valid outer JSON but leaked wrapper characters into the translated field. |
| 242 | Generic expansion device | XG Mobile dock | 7B preserves the dock referent here. |
| 267 | Mouse stands | Mouse stands | Both miss mouse pads. |

The authored controls show no gram/watt substitutions in six paired unit
cases, while still exposing weak device and technical vocabulary. A second
7B answer, the negative phone-variant control, also ends in a `」}]}`
wrapper-like suffix. The raw replies are retained. Thus **64/64 outer JSON
and target IDs did not mean 64 usable subtitle lines**. These two suffixes
are a newly confirmed output-validation failure. The follow-up
[REG-034](../regressions/catalog-v19.json) and
[guard contract](../../docs/reference/model-text-json-tail-guard-v1.md)
add a narrowly scoped pre-checkpoint rejection with two related and three
negative controls. `task test:context-v6` and the full `task check` passed
after the fix. No line was edited or republished as a translation from
this screen, and no post-fix natural full-file rerun has been made.

This is AI triage, **human Chinese/Russian review 0/32 cases and listener
review 0**. Source rights and audio alignment remain unverified. The
archived 268-cue candidate stays `needs_review`; neither 7B nor 1.8B is
promoted. A clean Windows installation, real accepted script and full
dubbing pilot still await their separate gates.
