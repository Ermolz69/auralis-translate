# Real v5 token-preflight journal result

Date: 29 September 2026. Task: `CTX-02` (partial). The
[frozen plan](2026-09-29-inference-preflight-p01-plan.md) fixed the one-case,
two-arm source, model, limits and stop criteria before inference. The first
`task eval:journal:preflight:probe` invocation passed Rust checks and built the
CLI, then failed with sandbox `EPERM` while Node tried to spawn `git`, before
model doctor or server startup. No model or HTTP request ran. The
[failure record](../reports/inference-preflight-sandbox-failure-2026-09-29.json)
is retained. The same task passed with authorized local process access.

Both arms used the same complete authored three-cue SRT:
`哥哥刚下车。` → `到了。` → `门开了。`. Baseline yielded `Прибыли.`;
scene context yielded `Приехали.`. The context arm again uses plural for an
explicitly singular older brother. This is a source-aware AI observation,
not a human score or an adequacy rate. The proposed reference was not sent
to the model. The original source and structural bytes were preserved; each
arm saved three blocks and offline re-export matched its output byte for byte.

The [raw report](../reports/inference-preflight-p01-2026-09-29.json) SHA-256 is
`5dfc21fc10c62c04eacd4d4a14033ec6c6e50dce09399b0a5f5ba895915a67d8`.
It records the candidate Git revision `589ac1c`, optimized CLI SHA-256
`ed9fb41611f9df23be3be32691555118c5ecc5c11d61dc4bd556aa22c76e5bf3`,
checked runtime SHA-256
`6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`,
model revision and GGUF hash, both profile hashes, exact prompts, raw/accepted
chat responses, tokenizer observations, source/map/output hashes, resources,
errors and command durations. The retained local SQLite/source/output copies
are under `.cache/eval/inference-preflight-p01-v1/run-dM8h6a`.

There were 18 loopback requests: six server preparation probes, six chats,
three `/apply-template` calls and three `/tokenize` calls. The
[journal check](../reports/inference-preflight-p01-check-2026-09-29.json),
SHA-256 `9d3102d86d81e9ba3c02993e53109894fb0b2ddbde725e1d4c89ba3771aae306`,
matched all six chat rows and all six scene-arm preflight rows to the proxy in
request order. It compared exact request body digests, parsed raw preflight
replies, rendered prompt hashes, token counts, chat raw bytes, server token
usage and accepted target text. The old v7 chat-only 1.8B and 7B reports still
pass the revised checker. A missing journal write stops the network request;
HTTP 503 and invalid token arrays retain bounded raw failure bodies and send
no subsequent chat in fixture checks.

Baseline chats used 561 prompt and 95 completion tokens; scene chats used 681
prompt and 91 completion tokens. Proxy chat duration sums were 1,099.208 and
1,608.695 ms; complete CLI file walls were 8,861.562 and 9,388.741 ms.
These are one repetition with a shared warm runtime and do not establish a
speed difference. In 18 approximately one-second resource samples, observed
model working set peaked at 1,549,062,144 bytes and whole-device GPU memory
at 7,945 MiB; both are sampled lower bounds, and GPU use includes other apps.

`task test:inference-journal` passed 3 SQLite journal, 8 migration and 13
provider tests. `task eval:journal:legacy:check` and
`task eval:context:7b:journal:check` passed on retained v7 data.
`task eval:journal:preflight:probe` passed on the authorized rerun.
After source formatting and lint repairs, `task fmt`, `task lint`, the full
`task test`, `task plan:check`, `task docs:check`,
`task eval:regression:check`, `task site:build` and `task site:check` passed.
Schema 8 preserves v7 chat rows but is not readable by a schema-7 binary;
production rollback needs a pre-upgrade database backup with the old binary.
Model verification before an attempt, Auralis host attempts, natural long-file
quality, independent human review, clean installation and audio are still
open. This evidence closes no G1–G9 or A1–A6 release gate.
