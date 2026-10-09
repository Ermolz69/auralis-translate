# Frozen Vivo scene post-edit comparison

Date: 10 October 2026. Tasks: `CTX-03`, `LONG-04`, `EVAL-04`.
Experiment ID: `VIVO-SCENE-POST-EDIT-2026-10-10-v1`. The prior
[focus-only screen](2026-10-10-vivo-focus-slot-v1-result.md) repaired zero
of three primary source relations. This one-factor candidate is a second
7B pass that edits **a contiguous scene**, given its original Chinese cue
texts and the preserved Russian v8 draft. The baseline is the unchanged
first-pass draft; the candidate gets one additional inference pass. A
post-edit pass cannot be compared as an equal-compute model-speed arm.

## Frozen inputs and split

- Original-platform 467-cue Vivo Chinese SRT SHA-256
  `b100803367b95fa55fc638b1ff39a0abfa0d5b8183ebe58d58b1a87242d9d8c4`.
- Complete 7B/v8 Russian draft SHA-256
  `4451868ea3e7cbb3ed81f3d24b5f85bc61a749168b213c54c88ae552208c4831`.
- Retained 36-reply source-fact journal SHA-256
  `72e52f740ffa1b4dce7e88168a6872eb2687ab44e1f39fd19e0316a10b8f767f`.
  Use only the five `REG-066` negative baseline answers as control drafts.
- Hy-MT2-7B Q4_K_M SHA-256
  `9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b`;
  v8 manifest SHA-256
  `c287c53efbb4ce78471b64648ea3dd2f521363df0e168b7a61df1fdd6ae0479a`;
  llama-server SHA-256
  `6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`.

Five known natural development windows from the full draft, fixed before
inference: cues `57–60` (9400), `273–277` (36-month planning), `278–282`
(joint team), `325–329` (after-midnight work), `464–467` (future products).
The post-editor sees source Chinese context up to two cues on either side
but only the window's Russian draft lines. Five exposed authored negative
controls are `REG-066`'s explicit first generation, 36 months **after**
start, money **and** team, 11–12 at night, and already available products.
For each control, use the prior baseline request's Chinese target/context
and prior raw baseline Russian output; do not use its candidate arm or
reference/expected fields. These are correlated development cases, not a
sealed holdout. All expected meanings stay in the offline review dossier,
never in inference input.

## Identity, budgets and stopping rule

Freeze the exact ten request and baseline hashes and committed harness before
inference. Keep cue IDs, ordering and timing immutable. Use the same model
alias and v8 sampling values (temperature 0.7, top-p 0.6, seed 101), one
local server, 2,048-token context, a 1,024-token response limit and 64-token
safety margin. Maximum 10 chats, 20 template/tokenizer preflights, 40,000
combined tokens, 120 seconds per chat, 30 seconds per preflight, eight
minutes wall time, zero retries and one attempt. Stop and retain the raw
failure on an invalid ID/order/string, request/hash/resource failure or
budget overrun. Store exact source, draft, request/reply, token/time and
resource records privately; publish only hashes and per-case outcome.

Source-aware AI triage must inspect every changed cue and its neighbors,
including negation, counts, actors, time, category and scene continuity.
First reject a candidate with any new major meaning error or malformed
answer on the five negatives or natural windows. Shortlist for a later
full-file strategy only if at least two of the three primary relations
(36-month planning, team, future products) improve and all five negatives
retain their facts. One seed, exposed cases and AI review cannot accept a
full SRT, model profile, spoken script or G3–G5. Preserve failures, raw
replies and the original v8 result. No source rights or reviewer gate changes.
