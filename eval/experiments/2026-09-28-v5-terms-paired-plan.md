# Predeclared v5 term admission probe (v1)

Frozen before inference on 28 September 2026. Task slices: `CTX-02`,
preparatory `CTX-03` and `CTX-04`. This is development evidence, with
AI-authored and unreviewed Chinese scenes and term choices. It cannot pass a
human language gate or license-dependent release gate.

Question: with the same source, map, 1.8B Q4 model, 2,048-token runtime,
decoding and v5 prompt, does an explicit scoped term appear only in the
intended target request, retain protected facts, and yield a complete
recoverable SRT? Compare `no_terms` and `terms` in that order on `t01`–`t03`.
The only changed input is the terms ledger. The three cases cover a Chinese
name with a different name in context, negation, and a name with a monetary
fact. Proposed Russian references and expected facts stay outside model
requests. Do not change prompt, profile, input order, case list, or retry
strategy after observing outputs.

Frozen dataset: `eval/corpora/v5-terms-paired-v1.json`, SHA-256
`6ae5b080841d22db0b28dbdafa0832101d5ef636b3121884223eb782373cebf1`,
split `development`, source provenance `ai_authored_unreviewed`. The exact
source and scene bytes are deterministically generated and hashed in the raw
report. The term-capable profile SHA-256 is
`fbd15130aafda335c081166869062225094c8ca5079e99e53824d039105ad70b`;
prompt template SHA-256 is
`7eed5a47e3679f8b20113dd2842bf581b9760c56d83c84283b57884c3e4414a1`.
The model revision and GGUF SHA are
`a0c709d9fac510f2c807aa3af52872340dc37a4a` and
`dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699`.
The llama-server executable SHA-256 is
`6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`;
the selected device is an RTX 3070 with 8,192 MiB reported VRAM. The
`doctor` check must validate local weight bytes before inference.

Run `task eval:v5-terms:paired` once, one model startup, one repetition,
six complete SRT files, at most 20 chat requests and 98 loopback requests,
10 minutes after readiness. One attempt per target; stop and retain all
failure evidence on any source, structure, budget, identity or re-export
failure. The proxy retains every rendered request and raw model response;
the report retains timings, usage, resource samples, accepted text and file
hashes. The planned comparison is exploratory, not a selected release
configuration. A second run needs a new declared identity and budget.

Observed outcome: **failed** after 15 model chats. The executable budget
calculation allowed only 62 loopback requests despite the stated 98-request
ceiling; the 63rd request was rejected before reaching the model. The
[retained raw report](../reports/v5-terms-paired-v1-failed-2026-09-28.json)
has SHA-256
`445354cc5921eda104a102f5028434a65c9730160cf98f021e6034bf025d38f9`.
This partial run cannot be scored as a three-case pair. The initial sandbox
attempt also stopped before inference because Node child-process creation was
denied; it did not produce a model observation.
