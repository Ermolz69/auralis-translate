# V7 batch implementation and real-model stop

Date: 2 October 2026. Scope: partial `LONG-01` and `EVAL-04`; plan:
[bounded authored screen](2026-10-02-v7-authored-batch-plan.md); machine summary:
[report](../reports/2026-10-02-v7-authored-batch-screen.json).

The opt-in v7 profile now admits up to eight source segments per durable batch.
It renders multiple target slots, same-scene source-only context, exact slot IDs,
approved terms and protected monetary facts. It sizes the **rendered** chat
prompt with the checked llama.cpp template/tokenizer, reserves response tokens,
removes distant context before splitting target slots, and refuses a single
oversized target. The v9 SQLite journal records each shared raw chat request as
one `validated_batch` row with its restored ordered slot array. A failed
subrequest leaves no parent batch checkpoint or published result. V1–v6 profile
identity and old preflight journal kinds remain distinct.

`task test:long-batch-v7` verified exact mapping, multiline slots, money
restoration, wrong/missing/swapped IDs, context trimming, split with source-only
peer context, first-half success followed by second-half failure, v8→v9
preflight migration, v7 CLI admission and v6 resume refusal. The new
`REG-051` controls exercise an adjacent money cue, three explicit currencies,
a noncurrency word containing `евро`, normal protected money restoration and
ordinary nonmoney target mapping. These are deterministic contract checks,
not translation-quality evidence.

The real 1.8B/Q4_K_M screen used the same four authored Chinese cues in one
scene. Source SHA is `ad88b2d2f96b153d5d8880175b321167263d7abaae48ca693d89b925459bc8a7`;
model SHA is `dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699`;
llama.cpp binary SHA is
`6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`.
The initial sandbox attempt stopped at `spawn EPERM` before any chat. Its report
SHA is `c241ae362ad723700b63667e32dba0afff62ebe4083de14a3cf62691c8bb1ec1`.

The first permitted attempt retained two real chat requests and stopped at cue
2. At cue 1, source `王经理说，明天不是星期五。` with the ticket-price cue in read-only
context, the model returned `Этот билет стоит десять юаней, не нужно платить сто
юаней.` under **cue 1's correct ID**. The old structural validator accepted
that wrong meaning as checkpoint 1/4. At cue 2, the model returned a version
of cue 1 without the two protected money tokens, so validation stopped the
run; zero result files were published. Request 1 used 240 prompt and 49
completion tokens; request 2 used 354/45. The private raw report SHA is
`e8ba208aa2ffd842bbb51dfcdce5aee527a6fc776dc0806b67a63e0c5cf474dd`.

After the currency-invention guard, one bounded repeat produced the **same**
wrong first response. It was rejected as `invalid_candidate`, with zero
checkpoints and zero results. Request usage remained 240/49 tokens. The new
private raw report SHA is
`ad6b8505f89b6386a0fca47adcd4570988cb66536aac1f5cefb5853e0f91cebb`.
The guard closes this observable monetary context leak but cannot recognize
all plausible wrong cue substitutions. The planned batch-size 4 arm was not
run because the frozen stop rule ended the experiment on the first failed arm.
There is therefore **no measured batching speed or quality comparison**.
Device-wide GPU samples were about 3.8–3.9 GiB and include other processes;
the server working set was about 1.51 GB at the sparse 5-second samples.
These are lower-bound observations, not isolated peaks.

Review is source-aware AI triage, with no Chinese–Russian human reviewer or
listener. The fixture is authored development data, not natural eligible
source or holdout. Next: diagnose target/context salience with one versioned,
bounded contrast, then compare 1/4/8 and seam shifts only if both arms can
complete without accepted context leakage. Long natural files, human review,
G3–G5 and A1–A6 remain open. The failed responses and original manifests are
retained privately; the public page must label this as an open regression.
