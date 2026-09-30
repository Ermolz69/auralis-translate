# Archived ASUS v6 rendered-token budget audit plan

Date: 1 October 2026. Partial `LONG-01` engineering evidence. This is a
read-only analysis of the retained 268-cue 1.8B v6 ASUS run, not another
translation or a quality review. The source SRT is SHA-256
`923aed3991c2308d92b89c45181cea8ec7ece74e9b4d3a3ce0234d95e329913b`;
the raw run report is SHA-256
`1d8addf0860cb88f0161ac6eeed3fc45351ab9912aaf0eff2b39a76772a26413`.
The exact model, runtime, profile, CLI, scene map, raw requests and private
result are retained under `.cache/eval/commons-asus-full-v6-slot-v1/run-7XjHrR/`.

Run `task eval:long:asus:v6:tokens:private` once after this plan, verifier
and Taskfile command are committed. The command rechecks the retained full
run, then pairs each `/apply-template`, `/tokenize` and chat request by
ordered target identity. It requires identical prompt messages and response
schema in the template and chat requests, identical rendered-prompt hashes
in the two preflight calls, and equality of tokenizer count and server
`usage.prompt_tokens`. It verifies all 268 single-slot IDs in order and
that context contains only the adjacent source cues in the declared one
scene. The 2,048-token context reserves 256 output and 64 safety tokens,
leaving a 1,728-token prompt ceiling.

The output is a private machine-readable summary at
`.cache/eval/asus-v6-token-budget-audit-v1/report.json`. Record count,
minimum, nearest-rank median and p95, maximum and its cue IDs, total prompt
and completion tokens, minimum headroom, context trim count, and first/middle/
last boundary IDs. Retain no subtitle text or raw response in the summary.
If an existing output differs, fail without overwriting it.

Budget: one archival pass, zero model/server/network requests, no retries,
no source or candidate edits, and at most one new summary file. This audit
can establish the actual rendered-token distribution of this one retained
run. It cannot establish a multi-target request size, 4,096-token memory
behavior, long-file semantic quality, or an SLA. A new profile or source
requires a separately declared experiment identity.
