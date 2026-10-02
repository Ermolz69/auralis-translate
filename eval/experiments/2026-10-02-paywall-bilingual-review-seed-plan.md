# Paywall bilingual-review seed screen

Date: 2 October 2026. Experiment identity:
`DATA-03-paywall-bilingual-review-seed-v1`. This is a development-only,
unassigned technical screen. It does not admit a cue, allocate a holdout,
create a Russian reference, approve a model, or certify the spoken language.

## Pinned inputs and comparison

Use the unchanged CC BY 4.0 Traditional Chinese SRT from
`paywall-chinese-4b4ffc0c`, SHA-256
`3406fcd365446d727f31c4ecf576de6c3b5e168658c3f5d276fea8142ddb5a4b`.
The matching OGV is retained, but its catalog language is English. The
source and audio rights are approved in the existing candidate inventory;
Russian reference rights and human alignment are not. Keep both original
files unchanged and private.

Freeze three four-cue windows: original IDs **15–18** (25.2 億美元,
equivalent to 2.52 billion USD, Elsevier/Biomaterials name and 10,702-dollar
price), **465–468**
(journal rejection and reviewer roles), and **861–864** (Elsevier and a
negated business claim). Their locations span the beginning, middle and end
of the 880-cue file. Retain source-only neighboring cues within each four-cue
window. No Russian answer, reference, expected translation, English audio
transcript, film's English subtitles or later holdout text may enter a model
request. A future volunteer packet can include the source, permissible
context and opaque candidate outputs only after consent.

Compare the pinned Hy-MT2 1.8B Q4_K_M and 7B Q4_K_M model manifests with the
same v5 scene prompt and one target per request. Run order: 1.8B, then 7B,
one attempt and one repetition per model. The existing profile temperature
is 0.7 and the CLI does not pin a random seed, so this is a screening pair,
not a deterministic superiority experiment. Exact model/runtime/CLI/profile
hashes must be recorded by the private run. No model is selected from this
screen without independent bilingual judgment.

## Budgets and retained evidence

Before either run, use its Taskfile preflight to verify the source hash,
12 target IDs, model/profile paths, checked license state and unused
experiment directory. Run one local server at a time on the RTX 3070;
never load both models together. Per model: at most three four-cue files,
12 target chat calls plus four structural retries, 64 total HTTP requests,
1,024-KiB request body, 15-minute inference wall limit after server startup,
three-minute startup limit, 130-second upstream timeout and at most 256
response tokens per cue under the pinned profile. Stop on the first
structural/runtime failure, exhausted budget or source hash drift; do not
retry the whole experiment. No paid or external inference.

Keep every source subset, raw HTTP request/response and token count,
accepted/rejected candidate, CLI command stdout/stderr, durable SQLite state,
elapsed time, runtime output and one-second CPU/RAM/GPU samples in ignored
private storage. Verify offline re-export of every completed file. After
both attempts, produce a redacted public summary with exact denominators,
hashes, wall/resource/token measurements and failures. AI editorial triage
may identify suspected errors and select new regression controls but is
never placed in a human-review field. Human adequacy and audio listening
coverage remain zero until actual people review.
