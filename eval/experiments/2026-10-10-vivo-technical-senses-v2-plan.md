# Technical sense v2 after REG-075 preflight rejection

Date: 10 October 2026. Tasks: `CTX-03`, `LONG-04`, `EVAL-04`.
Experiment ID: `VIVO-TECHNICAL-SENSES-2026-10-10-v2`. The v1 frozen
screen was rejected **before inference** because affirmative `不断` in the
natural semiconductor-process cue was mistaken for negation. Preserve
its freeze, helper, preflight result and REG-075 without editing them.
Use the same pinned original 467-cue Chinese SRT, Hy-MT2 7B Q4_K_M,
v8 request prefix, manifest and llama-server identities declared in
[v1](2026-10-10-vivo-technical-senses-v1-plan.md).

Change only the provisional term-scope decision: remove the fixed
affirmative continuation word `不断` before looking for negation; keep
real `不`/`没`/`非` negation and quoted mentions excluded. Assert cue 393
now receives a `制程` sense note, while all other source/context bytes
and existing REG-073 case requests retain their v1 identities except
that candidate request. Add four authored REG-075 controls to the v1
ten cases: two affirmative continuation positives and two genuine
negatives. They are exposed development cases, not a sealed holdout.
No expected Russian subtitle sentences or review rubric enter requests.

Freeze 14 case pairs and all 28 exact request hashes before inference.
One server, one attempt, zero retries, maximum 28 chats, 56 rendered
template/tokenizer preflights, 60,000 combined tokens, 2,048 context
tokens, 1,024 response tokens plus 64 margin, 120 seconds per chat,
30 seconds per preflight, nine minutes wall. Seed 101, temperature 0.7,
top-p 0.6 and GPU offload setting remain as v1. Save every raw request,
preflight, completion, validation and resource sample; stop and retain
failure on any invalid response, identity mismatch or budget breach.

Source-aware AI review must inspect all 14 pairs, including changed
technical meanings, neighboring context, counts, actors, negation and
new errors. Shortlist only if at least two of three natural terms improve
and all related positives/negative controls preserve the required facts
with zero new major errors. A shortlist is not G3–G5 admission; it only
permits a separately planned new-source and full-file candidate test.
Otherwise reject and preserve v8. No product, spoken-script, source-rights
or audio decision changes here.
