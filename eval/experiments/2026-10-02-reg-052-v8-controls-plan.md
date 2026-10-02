# REG-052 bounded v8 name and question controls

Date: 2 October 2026. Task: partial `EVAL-04` / `LONG-02`. This is an
authored development screen, not a holdout or language acceptance. The
observed four-cue v8 CLI output for cue 3 varied the rendering of 小李 and
produced an ungrammatical Russian question in the batch-of-four arm. The
exact outputs, source and private report are pinned in `REG-052`.

Run the six already frozen `related_controls` and `negative_controls` in
`eval/regressions/v8-name-question-controls-v1.json` (SHA-256
`23ecdaeb253d281e7651d5b76acdf10fd672793b428fd13262d38672a2ac82ed`).
Only the Chinese `source` field enters model requests. The English
`expected_meaning` field stays out of the prompt and is used only for a
source-aware AI assessment after all raw responses are retained.

Use the actual v8 single-target cue-3 chat from the retained private CLI
report `.cache/eval/v8-authored-batch-v1/attempt-GdrV2t/report.json`
(SHA-256 `ecdf4d7e02190a5b81e8fd06c0477c7bb5219076ad2138a91dbd9d15f912ee52`),
whose request SHA-256 is
`3ab71e9b2f09786dfcb7d7c38470b4aa1a81ce964ba56334a8f5b1ff8e4fed91`.
Keep the v8 instruction, target ID, output schema, model parameters and
two neighboring Chinese cues. Replace only cue 3's Chinese text. Compare
the original source-only `source_context` against an empty context to expose
context sensitivity, not to assert which is better. The fixed neighbors
are intentionally an adversarial stress for controls with different actors
or actions; interpret those outputs as stress results, not natural scenes.
Seeds are 101 and 202; alternate context-on/off order between seeds.

Pin Hy-MT2 1.8B Q4_K_M GGUF SHA-256
`dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699`,
llama.cpp `b10977-0ecb159c9` SHA-256
`6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`,
and v8 manifest SHA-256
`1803aeb68428e1b138a17ed72b01abe1cc5fbc5845b5bca66a402b8936b1081f`.
One server, 2048 context, requested 99 GPU layers, one slot, Jinja, RAM
cache disabled. Render and tokenize every request. Require prompt at most
1728 tokens for 256 response and 64 safety. Check actual chat prompt usage
against tokenizer count. Retain requests, raw responses, parsed candidates,
tokens, errors, time and sparse resource samples in ignored private storage;
publish a redacted aggregate with explicit zero human reviews.

Budget: 24 chats, 48 preflights, 90 seconds per chat, 15 seconds per
preflight, 120 seconds readiness and 10 minutes wall; no retries or parameter
search. A model semantic failure is data. Stop on infrastructure failure and
retain the partial report. A sandbox process-spawn failure may be repeated
once with unchanged inputs after retaining the failed attempt. Run
`task eval:regression:v8:name:preflight`, then
`task eval:regression:v8:name:probe` and the report checker. Do not approve
translation or spoken script from these controls.
