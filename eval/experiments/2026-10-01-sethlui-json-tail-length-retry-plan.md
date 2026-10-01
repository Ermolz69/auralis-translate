# Frozen 7B length-limited wrapper retry screen

Date: 1 October 2026. This is a new, single-run `CTX-02`/`CTX-05`/`EVAL-04`
development experiment after the [v1 failure](2026-10-01-sethlui-json-tail-retry-result.md).
It asks whether a second identical source-only request can complete when the
first response stops at `finish_reason=length` inside a repeated `」}]}`
wrapper loop. A failed or truncated first answer is never accepted. The
earlier run and its 61 checkpoints are immutable; this uses a fresh state.

The private 263-cue Chinese SRT SHA-256 is
`4777e11caa115e893f2328c2a33c25a76c7391ace8ecf0ac4b9436635fc27964`;
its immutable parent is
`077aef6a49aa7128f5ddd349f38ffc84dd669f5e4bbfae6d692efa2d78304967`
and the derivative mapping is
`da63dec61c03ccbfcc307aa028e9499b8ba9a65de41c1df6b0daab5a629a9a4f`.
The 12:18 source video SHA-256 is
`6e29f1512a76f553bdfc1678f458a69cf010e4653ac3f1cdfc4c45742bfb39d6`.
These unassigned materials are private, rights-unreviewed and lack a human
Chinese speech-alignment check. No sealed holdout is involved.

Use Hy-MT2 7B Q4_K_M, revision
`ab8472660ac61fac25f1af43fac2599d52a8a775`, GGUF SHA-256
`9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b`
and llama-server SHA-256
`6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`.
The new checked v6 manifest SHA-256 is
`268c4d00eee8994936d7019d4cad47a5193a01e459ad9ed4214ea30facd102f9`.
It differs from v1 only by `retry_length_json_tail_once: true`; both have at
most two block attempts. The model, prompt, schema, one-before/one-after
context, provisional scene map, generation settings and source-only request
remain the same. There is no explicit sampling seed, so stochastic variation
is unknown. `task eval:cli:build:receipt` passed before inference and retained
receipt SHA-256
`de1b8d7696727ff02e71fc59a069bd1586913653815413ba30251f8888cd17ca`.
It binds source commit `bf68147c0a366a7ce4683841d12058fe5ae13fb4`,
366 source files, source-tree SHA-256
`6d45750b42b2797f43494c6bf2568195ee603fad55ed09d5d1cb2d4e753418ec`
and release CLI SHA-256
`4bbe8ec9878498d8c6ea085c33801b52dbcd7732caa532cffba3e939e5be7eb7`.

One new server and one full-file CLI run are permitted. Bounds: 526 chats,
1,600 total proxied HTTP calls, 20 minutes of model-stage wall time, 130
seconds per upstream call, 180 seconds readiness and 600 seconds doctor. A
zero-chat infrastructure launch failure may be retried once with its failed
report retained and identical bytes; a model/content failure cannot. No
third attempt, temperature change, fallback model, copied state or post-hoc
text repair is permitted. Each request, raw response, token count, duration,
working set, whole-device GPU sample, error and durable checkpoint is kept
privately. A separate result appears only after structural validation.

Compare identical source cue IDs and exact rendered request hashes with the
archived v1 and first 7B runs. Report both attempts at every retried cue and
new errors. Selected AI source-aware checks include the name and roles at
11/32/125, 50 kitchen staff at 22, 30 dim sum plus 8 desserts at 35, negation
at 70/80/119/233/254, over 120 wines at 219, 2,500 metres at 223 and
beginning/middle/end and scene seams. These expected meanings are withheld
from model requests. AI triage is not an independent bilingual score. If the
run completes, it is an unreviewed structural candidate only.
