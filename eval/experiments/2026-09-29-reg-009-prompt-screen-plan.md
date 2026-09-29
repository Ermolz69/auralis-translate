# Frozen REG-009 identifier reminder screen

Status: predeclared development screen; no new model request has run. This asks
whether one source-only instruction improves exact ASCII code preservation in
the checked 1.8B v6 target-slot request. It does not change the production v6
profile or accepted long-file result. The new instruction is experimental.

Use the pinned [REG-009 failure pack](../regressions/long-v6-identifier-loss-v1.json)
and [complete raw journal](../reports/2026-09-29-long-v6-postlength-v2-journal.json.gz),
SHA-256 `4037c071a17ef38ed7b9bc4989601ef8da0784fb39881b9138abb9d008701a8c`.
Four authored **development** target slots and their archived v6 request hashes
are fixed before execution:

| Cue/line | Fact outside the request | Archived request SHA-256 | Archived identifier outcome |
| --- | --- | --- | --- |
| 1/0 | Train departs at 08:10; code AUR-0001 | `d8b471e2d98f8f134a178a5bfa70ff0e16ea5dc55f12620a98792a12d253391b` | Exact code kept |
| 2/0 | Do not open the door; code AUR-0002 | `dd22e6617ee5b63aa607a82d4e1566c734aca3c8869d6795376857b2c970e39c` | Code omitted |
| 514/0 | Do not open the door; code AUR-0514 | `f63855e1afba4b81d6718f19f75f4e6131810c407c06515fda5017c22444ed66` | Code omitted |
| 1000/0 | This is not the last train; code AUR-1000 | `80eb33cf4bc83e18fbb291c9c118e42ad92b6626f9a2509e484ff8b4d58699e6` | Code omitted |

The model receives the original Chinese source and archived neighboring source
context only; this plan's Russian interpretation and accepted earlier answers
are never inserted into prompts. Compare the exact archived v6 request with the
same request plus one English sentence immediately before its output contract:
"Preserve every ASCII identifier in the target source with uppercase letters,
a hyphen and digits exactly once in the Russian text; copy its spelling and
digits unchanged, and do not copy identifiers from context." The changed
prompt is a separately hashed experimental variant. Model, source, context,
target-bound JSON schema, decoding and response limit stay the same. In each
seed/cue pair, run baseline and reminder consecutively, alternating which arm
goes first by case index; do not choose a favorable order after seeing output.

Use pinned Tencent Hy-MT2 1.8B Q4_K_M GGUF SHA-256
`dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699`
and llama.cpp server SHA-256
`6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`.
Request 2,048 context tokens, 99 GPU layers, one slot and zero RAM cache;
record observed resource samples without claiming actual offload from flags.
Seeds are `101` and `202` for both arms. Total **16 chat requests**, no retries,
one server start, 120 seconds per request and 20 minutes total wall from the
workspace start. Stop on exceeded budget, persist failures and do not expand
the matrix silently. Run `task eval:reg009:prompt:probe` only after this plan,
Taskfile entry and harness are committed. Archive full rendered request, raw
response, HTTP/finish reason, accepted structural text, tokens, timing,
identifier check and resources. Human review is missing; this screen may
justify a new versioned profile and strict guard, but cannot pass G3–G5.
