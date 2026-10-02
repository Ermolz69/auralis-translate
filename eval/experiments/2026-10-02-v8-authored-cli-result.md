# V8 target-first CLI: both batch sizes complete, name and grammar open

Date: 2 October 2026. Frozen [plan](2026-10-02-v8-authored-cli-plan.md);
machine [summary](../reports/2026-10-02-v8-authored-cli.json). Opt-in
implementation uses prompt version 8 and a distinct checked template hash.
It inherits the v7 instruction, multi-slot response format, source-only
context, protected money restoration, real tokenizer budget, durable SQLite
v9 request journal and atomic publication. Only the target/context JSON key
order changes. The previous v7 profile remains accepted under its old hash.

One real Hy-MT2 1.8B/Q4_K_M server translated the same four authored Chinese
cues twice through the release CLI. The manifest SHA-256 was
`1803aeb68428e1b138a17ed72b01abe1cc5fbc5845b5bca66a402b8936b1081f`;
model `dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699`;
runtime `6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`;
release CLI `854da57df8dff73e5349a3bb6eb7a50352ca5ff7d2ef74e89ec4aaecc1a7ad3e`.
Private report SHA-256 is
`ecdf4d7e02190a5b81e8fd06c0477c7bb5219076ad2138a91dbd9d15f912ee52`;
it retains exact raw requests/responses, the preflights, checkpoint rows,
candidate text, errors and resource samples. No Russian reference entered a
request. The copied source hash remained
`ad88b2d2f96b153d5d8880175b321167263d7abaae48ca693d89b925459bc8a7`.

| Target batch | Chats / preflights | Prompt / completion tokens | Chat HTTP sum | CLI time | Checkpoints / full SRT |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 4 / 8 | 1,104 / 178 | 1,968 ms | 9,938 ms | 4 / 1 |
| 4 | 1 / 2 | 467 / 158 | 1,549 ms | 7,880 ms | 1 / 1 |

All five chats passed structural validation and retained one `validated_batch`
row per request. Both results have review state `needs_review`; their SHA-256
values differ because output wording differs. Cue 1 now conveys Wang and the
not-Friday negation in both arms. Cue 2 kept the two yuan amounts through
protected tokens in the correct order. Cue 4 kept the negative answer and
table location. The third cue, however, is an **AI-identified language risk**:
one-target output `Ли Шао ли передал ключи менеджеру Вану?`; four-target output
`Был ли Ли Сяо передал ключи менеджеру Вангу?`. Both renderings of 小李 are
inconsistent, and the four-target Russian question is ungrammatical. No
Chinese–Russian person adjudicated the name or any cue. See the new
`REG-052` development controls for names and question form; they must be run
under a frozen model budget before any quality claim.

This single sequence measured fewer HTTP calls and fewer tokens for size 4,
but cannot establish a speed gain: the second arm benefited from the running
server and prompt cache, and there is no repeated paired timing distribution.
Four sparse resource samples reached 1,542,537,216 bytes of server working
set and 3,662 MiB device-wide GPU use; these are not isolated peaks.

The original v7 size-1 screen failed before export on copied context money;
this v8 screen is **not** a controlled speed comparison against that stopped
run. V8 is a development profile, not the selected release candidate. Next:
exercise name/question controls and nonmonetary context swaps, then compare
batch boundaries on a natural admitted long source. Human meaning review,
revised spoken script, actual listening, clean Windows target and G3–G9/
A1–A6 remain open. Neither full SRT is approved for Auralis dubbing.
