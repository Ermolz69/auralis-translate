# Paired real-model REG-058 semantic controls

Date: 2 October 2026. Known authored development controls, not a sealed
holdout or human review. The complete natural 7B/v8 draft has six
source-aware AI findings pinned in
[REG-058](../regressions/v8-natural-7b-semantic-risk-v1.json), pack SHA-256
`fcba9d337e8bdf3dd0d431cf886917bcefa999a44d9eb30fcc5450a6147ebe09`.
This bounded screen asks whether they recur on new authored positive and
negative targets. The natural source, 7B draft and original run remain
immutable and private.

For each of the six source cue IDs, take the **exact 7B single-target v8
chat request** and replace only `target_slots[0].source_original` with the
pack's authored related or negative Chinese source. Keep its original
source-only neighbor context, target ID, schema, decoding parameters and
response token cap. For the 1.8B arm change only `model` alias. The two
models thus see the same Chinese target/context per case. Do not send
`expected_meaning`, the original Russian 7B draft, a reference answer or
AI review notes in any prompt. The original request/candidate hashes are
retained for later comparison. Run positive then negative for odd-numbered
cases, negative then positive for even-numbered cases in each arm. Run
1.8B first, 7B second, each on a fresh server, one sample per request.

Pinned GGUF SHA-256: 1.8B
`dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699`,
7B `9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b`.
Pinned runtime SHA-256
`6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`.
Both use the existing batch-one v8 manifests, with SHA-256
`3762873e48f3e7864d3cf655e295d4ac383dd30ac5f7292f53f25fc5887761d7`
and `a748572cea20fc46c53ced5c39c5b8e3fb85887c2e90d559a27fd41ea818f2bc`.
Context window 2,048, one server slot, 99 requested GPU layers, Jinja and
RAM cache off. The exact original 7B private report SHA-256 is
`9ae192177dd51611f49adf7699ca4fe9677a230dc74cbdedded2618040cc193c`.

Per arm: 12 chats, 24 template/tokenizer preflights, 2 minutes per chat,
15 seconds per preflight, 3 minutes readiness; total 20 minutes for two
arms. No retries, prompt search or additional seeds. Record every raw
request/response, rejected answer, rendered token count, completion
tokens, wall time, sampled process/GPU memory, original/candidate hashes
and stop reason. Stop an arm on infrastructure failure; for a model-format
failure retain it and continue other cases if the server remains healthy.
Assess target meaning separately afterward as AI review, with explicit
uncertainty and no automated acceptance score. Any new confirmed failure
gets a linked regression. The 7B natural result remains `needs_review` and
G3–G5 stay open regardless of authored-control performance.

Use `task eval:regression:reg058:preflight`,
`task eval:regression:reg058:probe` once, then
`task eval:regression:reg058:report` and
`task eval:regression:reg058:check`.
