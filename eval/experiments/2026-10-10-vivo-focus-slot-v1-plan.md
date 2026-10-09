# Vivo focus-slot v1: frozen 7B development screen

Date: 10 October 2026. Tasks: `CTX-03`, `LONG-02`, `EVAL-04`. The recent
source-relation review identifies three major errors in the complete v8/7B
draft. The source-fact hint and blanket seam-shift variants were rejected.
This screen tests one different factor: translating only the risky target
slot while retaining all Chinese source cues from its original batch as
read-only context. The v8 instruction, model, sampling and source wording
are unchanged. The original v8 requests, raw replies and full SRT remain
immutable.

## Frozen inputs and cases

- Original-platform Vivo Chinese SRT: 467 cues, SHA-256
  `b100803367b95fa55fc638b1ff39a0abfa0d5b8183ebe58d58b1a87242d9d8c4`.
- Prior 36-chat source-fact journal: SHA-256
  `72e52f740ffa1b4dce7e88168a6872eb2687ab44e1f39fd19e0316a10b8f767f`.
  Reconstruct both arms from the **baseline** request in this pinned journal;
  never feed its Russian replies to the model.
- Five exposed natural development cases, focus cues 60, 276, 280, 328,
  466. Three are the primary relation errors; 60 and 328 test known number
  and after-midnight risks. Five authored negative controls from `REG-066`:
  `explicit_first_generation` cue 1022,
  `thirty_six_months_after_start` cue 1027,
  `money_and_team_both_explicit` cue 1032,
  `eleven_twelve_at_night` cue 1033,
  `products_already_available` cue 1038. All are open development, not a
  sealed holdout or independent human reference.
- Model: Hy-MT2-7B Q4_K_M SHA-256
  `9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b`;
  v8 manifest SHA-256
  `c287c53efbb4ce78471b64648ea3dd2f521363df0e168b7a61df1fdd6ae0479a`;
  llama-server SHA-256
  `6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`.

## One-factor comparison and budget

For each case, arm A repeats the saved v8 batch request at seed 101. Arm B
keeps its exact prompt prefix and fields, but moves every nonfocus target
cue into `source_context` with its original Chinese text, ID and timings;
`target_slots` contains only the focus cue and the response schema expects
one translation. The union of Chinese source IDs and their text/timings must
be identical across arms. No Russian answer, expected wording, fact hint or
reference is inserted. Alternate arm order by case. Freeze all 20 request
hashes and the script before inference.

Maximum: 10 cases x 2 arms = 20 chats and 40 template/tokenizer preflights,
one local server, seed 101, zero retries, at most 60,000 combined tokens,
120 seconds per chat, 30 seconds per preflight, 10 minutes total. Stop on
missing/extra/duplicate IDs, prompt/source mismatch, untrusted response,
resource or time budget exhaustion; retain the failed raw attempt. Store
request/reply bytes, usage, timings and resource samples privately. Publish
only hashes, cue IDs, counts and separate AI interpretation.

## Decision

Reject if the focus arm has a new major fact error on any natural/control
case, an invalid structural reply, or a copied neighbor fact. Shortlist only
if at least two of the three relation errors improve under source-aware AI
triage while all controls retain their explicit facts. One seed and exposed
cases cannot promote a profile, full-file result or spoken script. Repeats,
other natural sources and independent Chinese–Russian review are required
before a product or G3–G5 decision. If no improvement, keep v8 unchanged.
