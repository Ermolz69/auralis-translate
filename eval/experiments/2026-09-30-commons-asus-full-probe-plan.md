# ASUS 268-cue natural long-file diagnostic

Date: 30 September 2026. Partial backlog IDs: `DATA-03`, `CTX-02`,
`LONG-04`, `EVAL-04`. The question is whether the existing checked 7B v5
scene path can process a second distinct, 10–20-minute natural Chinese SRT
without missing a slot, changing protected source bytes, or publishing a partial
result. This is one private engineering run, not a matched model comparison,
language score, source admission, approved spoken script, or release gate.

Source is the Commons ASUS ROG Ally Chinese TimedText revision `892592485`,
21,354 original bytes, 268 strict ordered one-line SRT cues and SHA-256
`923aed3991c2308d92b89c45181cea8ec7ece74e9b4d3a3ce0234d95e329913b`.
Its locally retained matching 240p VP9/Opus derivative is SHA-256
`9e4271f8112de2fa65ad67c4cec3390529e916d70363bc5f4c421f4479b97cc1`
and 882,223 ms by FFprobe. The private source is an unassigned development
candidate, not sealed holdout. Chinese speech alignment, speaker turns,
caption/audio rights and independent reference are not verified. No Russian
reference, expected meaning or prior model output enters inference requests.

Use the same `Hy-MT2-7B-Q4_K_M` GGUF expected SHA-256
`9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b`,
llama.cpp runtime expected SHA-256
`6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`,
v5 scene profile expected SHA-256
`9b34d86d3b0d872720ee729131efef99281e71a0000d202abea169d625a92e73`
and current release CLI. `doctor` and the private report must record the actual
bytes before translation. The profile uses one source cue on each side of the
target, no approved terms and no speaker claims. A provisional whole-video
scene map ends at cue 268; it does not assert a verified scene boundary.
The run uses 2,048 context tokens, 99 GPU layers, one parallel slot and the
profile's frozen decoding settings. Run order is preflight, `doctor`, one fresh
full-file CLI translation, structural verification, then offline reexport.
There is one repetition, no model retry and no concurrent TTS.

Budget: at most 270 chat requests, 850 total proxied HTTP requests,
1,200,000 ms model wall time, 180,000 ms readiness, 600,000 ms `doctor`,
and 130,000 ms for any single upstream HTTP request. `task
eval:natural:asus:7b:preflight` validates local source/media/model paths and
script syntax. `task eval:natural:asus:7b:probe` builds through Taskfile and
executes the one run. Stop at the first failure; retain raw requests/responses,
CLI outputs, durable SQLite/checkpoints, original and candidate bytes, resource
samples and server log privately under a new `.cache/eval/commons-asus-full-7b-v1/`
workspace. No partial SRT is published. If structurally complete, require
268/268 ordered slots, validated run state, exact source/protected-byte
retention and byte-identical offline reexport.

After the run, inspect source-aware beginning/middle/end and high-risk name,
number, negation and scene-boundary windows as AI triage, recording inspected
denominators and failures. A separate Chinese–Russian human review, source
audio alignment and rights decision are required before the text can be
approved or voiced. Keep any failure immutable; a resume needs a separately
frozen identity, checkpoint prefix and budget.
