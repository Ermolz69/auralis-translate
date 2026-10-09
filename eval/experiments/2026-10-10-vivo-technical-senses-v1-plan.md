# Bounded source-scoped technical sense screen

Date: 10 October 2026. Tasks: `CTX-03`, `LONG-04`, `EVAL-04`.
Experiment ID: `VIVO-TECHNICAL-SENSES-2026-10-10-v1`. This is one
development-only paired screen of a provisional source term note, not a
product v8 change or a human-approved glossary. The original-platform
Vivo Chinese SRT (467 cues, SHA-256
`b100803367b95fa55fc638b1ff39a0abfa0d5b8183ebe58d58b1a87242d9d8c4`)
is the only natural input. Three exposed REG-073 target cues are 172
(`多核`), 232 (`全大核`) and 393 (`制程`). Related authored positives and
negated negatives come from pre-existing REG-073. One unrelated
scenario-planning control checks exact baseline request identity.
These are exposed development cases, **not** a sealed holdout.

The source sense lexicon is derived from [MediaTek's Dimensity 9300
specification](https://www.mediatek.com/zh-cn/products/smartphones/mediatek-dimensity-9300):
`多核` concerns multiple CPU cores, `全大核` the all-big-core CPU
architecture, and `制程` the semiconductor manufacturing process. These
are short provisional term definitions, not reference subtitle sentences.
The model must never receive an expected full Russian translation or a
review rubric. Baseline uses the same v8 instruction, original Chinese
target and one neighboring source cue on either side. Candidate adds a note only for
an affirmative exact term in the **target** slot. Absence, explicit
negation and quoted word mentions leave the request byte-identical to
baseline. The source/context/slot IDs, timings, `approved_terms`,
protected facts, response schema and sampling parameters stay equal.

Pin the checked 7B Q4_K_M model SHA-256
`9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b`,
llama-server SHA-256
`6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`,
and v8 manifest SHA-256
`c287c53efbb4ce78471b64648ea3dd2f521363df0e168b7a61df1fdd6ae0479a`.
Run on local RTX 3070 8 GB with one server, context 2,048 tokens,
temperature 0.7, top-p 0.6, seed 101, 1,024 output tokens and 64-token
margin. Freeze all ten case identities, arm order and exact request hashes
before inference. Maximum: 20 chats, 40 preflights, 45,000 combined
tokens, one attempt, zero retries, 120 seconds per chat, 30 seconds per
preflight, eight minutes total. Stop on malformed output, source/hash
mismatch, resource failure or budget violation; retain failures and raw
responses. Record prompt/completion usage, wall time, memory samples,
raw/accepted hashes and exact source mapping privately.

Source-aware AI review of **every** paired answer must judge core/chip,
architecture, process/processor, negation, counts, actors and adjacent
scene continuity. No new major error is permitted. Shortlist the
candidate only if at least two of three natural technical errors improve,
all three related positives preserve their technical fact and all four
negative/absence controls retain their meaning. A shortlist authorizes
new-source testing, not a full-file product change. Otherwise reject it,
preserve v8 and add exact reproductions plus new related/negative
controls for each newly observed error. No human review, approved spoken
script, G3–G5 or audio gate can pass from this screen alone.
