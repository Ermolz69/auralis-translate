# Experimental Chinese batch profile v7

Status: implementation contract for partial `LONG-01`, 2 October 2026.
This profile is opt-in and has a new manifest/template identity. Existing v1–v6
manifests, requests, checkpoints and accepted results remain reproducible.
No quality, speed or release gain is assumed before a matched real-model screen.

V7 accepts a scene-mapped Chinese SRT and a requested batch size from 1 to 8
source segments. A batch is one durable checkpoint. Each line in its targets is
an ordered output slot with its internal segment ID and line index. One chat
request may translate several slots. Every request includes all of its target
source lines in `target_slots`; neighboring same-scene source lines outside the
request appear in read-only `source_context`. This includes targets moved out of
the request when a large batch is split for the token budget. Generated Russian
text, references and holdout answers never enter either input array.

The rendered chat prompt and response schema are versioned separately from v5/v6.
The response contains exactly one translation per requested slot in the same
order. The adapter rejects changed/extra/missing/duplicate IDs or line indices,
invalid text, altered protected facts and leaked JSON wrapper text before
accepting the request. A model response is untrusted even if it conforms to the
generation schema. All subrequests must pass before the parent batch can become
one checkpoint; a failure leaves no partial publication. The existing request
journal retains each raw subrequest anchored to its first slot and its complete
rendered body. The checkpoint retains the full mapped response. V7 does not
claim a separate per-slot journal row for a shared HTTP request.

The real original-platform 467-cue Vivo v8 screen found a narrow output-layout
failure: the 1.8B reply for cues 113–116 put an escaped terminal line feed in
each otherwise mapped single-line `text` field. The shared v7/v8 provider now
removes only terminal CR/LF characters **after** JSON parsing, before the
unchanged version-hashed decoder's control-character, currency and
protected-fact checks. It keeps the
raw response in the request journal. Leading or internal line breaks, tabs,
empty text and JSON wrapper leakage remain invalid. This deterministic
normalization changes no prompt, model, source, slot identity or saved older
result. The stopped run and its original invalid response remain preserved;
the change alone does not establish language quality or finish that run.

The 2 October authored real-model screen found a context leak: with Wang's
nonmonetary target and an adjacent ticket-price context line, the 1.8B model
returned the ticket's monetary sentence under Wang's correct slot ID. That
candidate passed the earlier structural validator. The revised v7 validator
rejects an explicit Russian currency unit in a slot whose Chinese source has
no recognized protected monetary amount. This is a narrow fail-closed guard;
it cannot prove that other context content was not substituted. The initial
failed manifest/template identity and complete raw requests remain retained
in the private attempt, while the current checked manifest has a new template
hash. No result from that first attempt was published.

For each subrequest, ask the verified server to render the actual chat template
and tokenize it. Reserve `max_tokens_per_line × slot_count` response tokens plus
the profile safety margin inside the declared context. Remove farthest external
same-scene context first. If targets alone exceed the budget, split the slot
sequence into ordered halves and retry sizing; never truncate a target or
protected fact. A single-slot overflow is a permanent typed failure before
chat. No response is generated for an oversized unsplit request. The new
profile requires a checked runtime identity, context size and safety margin.
Initial v7 disallows v6 source-prefix repair and JSON-tail retry so those
factors cannot obscure the batch comparison; their potential use needs a
separate versioned decision.

The first deterministic checks cover one/two/multi-line targets, exact mapping,
context isolation and scene boundaries, duplicate/wrong/out-of-order response
slots, money-token integrity, actual-token preflight, deterministic context
trimming and split/no-partial-result behavior. A later frozen real-model test
must compare batch sizes 1/4/8 and seam shifts on the same development sources,
with raw requests, token counts, memory, time and source-aware review. Human
review, eligible natural sources and the G3–G5 language gates remain separate.
