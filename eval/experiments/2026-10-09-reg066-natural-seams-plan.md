# REG-066 same-source natural cue-seam screen

Date: 9 October 2026. Freeze the plan, Taskfile harness and exact request
identities before inference. This is an `EVAL-04`/`CTX-03` development
comparison on a known, rights-unresolved YouTube source. It is not a sealed
holdout, human language rating, or source admission. Preserve the original
467-cue SRT, media, full-file drafts and earlier failures without edits.

The [REG-066 short-control screen](2026-10-09-reg066-authored-v8-screen-result.md)
kept most facts on authored phrases but did not repair five natural-file
risks. Test whether changing only the *four target cue boundaries* changes
the output at natural cues 60, 276, 280, 328 and 466. Each original arm
uses the exact source target and one-cue-before/after context extracted
from the pinned 7B full-file request. The shifted arm uses four adjacent
original Chinese cues, their original IDs and timestamps, and the new one
cue before/after; shift start forward one except cue 466, which shifts back
one at file end. The same focus cue remains a target in both arms. The v8
instruction, JSON schema, source text, model settings and seed 101 stay
fixed. No Russian reference, intended meaning, term hint or translated
neighbor enters a request.

Repeat the five negative authored REG-066 controls once per model with
their earlier unchanged four-slot prompts. Their outputs check sampling
stability and detect collateral fact errors. The frozen set is therefore
five natural pairs plus five negative controls per 1.8B and 7B model:
**30 chats**, **30 apply-template and 30 tokenize preflights**, two server
starts, zero model retries, at most 100,000 prompt-plus-completion tokens,
120 seconds per chat and 12 minutes total. A pre-spawn permission failure
can be retried once with the identical freeze only after retaining the
zero-call failure. Any other failure stops the screen and remains recorded.

Use the original SRT SHA-256
`b100803367b95fa55fc638b1ff39a0abfa0d5b8183ebe58d58b1a87242d9d8c4`,
7B full-file report SHA-256
`84a737e1cc8c7b468ea66718f2507882929344f259d7824d9071953d24c1a5b5`,
REG-066 pack SHA-256
`33b74c9a337acd931b87a4f101e54070c95a5ed69a40f04ab342768da24b061e`,
runtime SHA-256
`6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`,
and the pinned Q4_K_M v8 model/manifest hashes in the authored screen plan.
The separate freeze contains every rendered request hash. Retain raw HTTP,
token counts, timings, resource samples and failed attempts privately; a
public report may include source-free identities and selected Russian focus
outputs only.

After inference, AI triage must inspect both target outputs *and* adjacent
target/context continuity against the Chinese source, keeping `needs_review`
for ambiguity. Compare the same source fact across original and shifted
arms; report stochastic uncertainty from one seed. A shifted arm is rejected
for promotion if it introduces a major fact error or loses the related
source meaning anywhere in its target group, even if the focus cue improves.
The negative controls must show no new major error. Human scoring remains
separate and unavailable. No short screen alone justifies a 467-cue rerun,
model promotion, reviewed spoken script or RELEASE-05 admission.
