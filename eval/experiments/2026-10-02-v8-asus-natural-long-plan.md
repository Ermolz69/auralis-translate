# Bounded natural 268-cue v8 batch comparison

Date: 2 October 2026. Partial `LONG-01` / `LONG-02` / `EVAL-04`.
The checked 7B v8 profile completed an authored four-cue SRT and improved
known name/question controls. This next real CLI screen uses the already
retained natural Chinese ASUS ROG Ally subtitle file. It is known
development material with earlier v6 candidates and AI triage, **not** a
sealed holdout or an approved translation. Original source and media stay
in ignored private storage and remain immutable.

Source: `.cache/eval/commons-asus-rog-ally-892592485/source.zh.srt`, 268
ordered cues, SHA-256
`923aed3991c2308d92b89c45181cea8ec7ece74e9b4d3a3ce0234d95e329913b`.
The paired original test video is retained at
`.cache/eval/commons-geekerwan-two-media/asus-rog-ally-fd0d9bf6-f2b4-4329-a8cf-ad0b5becf72e/source.240p.webm`
(SHA-256 `9e4271f8112de2fa65ad67c4cec3390529e916d70363bc5f4c421f4479b97cc1`).
Use a copied source in two fresh isolated CLI states and one provisional
whole-video scene (`scene_end_ids: [268]`) for both arms. This scene map
tests batch seams and full-file handling; it does not prove actual scene
cut detection. Run 1.8B v8 then 7B v8, target batch four. The two
manifests differ in pinned model identity while sharing the checked v8
prompt and limits:

| Arm | GGUF SHA-256 | Manifest SHA-256 |
| --- | --- | --- |
| Hy-MT2 1.8B Q4_K_M | `dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699` | `1803aeb68428e1b138a17ed72b01abe1cc5fbc5845b5bca66a402b8936b1081f` |
| Hy-MT2 7B Q4_K_M | `9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b` | `c287c53efbb4ce78471b64648ea3dd2f521363df0e168b7a61df1fdd6ae0479a` |

Shared llama.cpp `b10977-0ecb159c9` binary SHA-256
`6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`;
release CLI SHA-256
`854da57df8dff73e5349a3bb6eb7a50352ca5ff7d2ef74e89ec4aaecc1a7ad3e`.
One model server at a time, 2,048 context, requested 99 GPU layers, one
slot, Jinja and RAM cache disabled. Keep the same source/scene map and
per-model tokenizer. Each CLI verifies its model and source, journals
template/tokenizer preflights and raw chat requests, checkpoints only
validated batches, and publishes a separate full SRT only on completion.
The public report will contain source-free counts, hashes, timings,
memory samples and AI risk coverage; private raw requests and subtitle
text stay ignored. No Russian reference or accepted prior output enters a
model request.

Per arm: at most 268 target chats (one per cue worst case), 536
template/tokenizer preflights, one CLI command, 15 minutes for command,
3 minutes server readiness and 20 minutes including loading. Total two
arms / 40 minutes. No model retry, regeneration or parameter search.
Keep the first failed result and proceed to the second model if source,
runtime and hardware remain usable. Stop the experiment if common
infrastructure identity, server start or source preservation fails.
Afterward verify immutable source, full cue/timing coverage, SQLite
checkpoints and request journal, start/middle/end IDs 1/2/133/134/267/268,
every batch boundary and a stratified source-aware AI risk sample for
names, quantities, negation and adjacent meaning. A complete file is
still `needs_review` pending independent language review. Run
`task eval:long:v8:asus:preflight` and then
`task eval:long:v8:asus:probe`; retain every failure and do not infer
performance or quality from different cache/order conditions.
