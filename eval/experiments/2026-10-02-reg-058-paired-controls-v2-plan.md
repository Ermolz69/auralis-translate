# Corrected paired REG-058 controls after a retained harness failure

Date: 2 October 2026. The [v1 screen](2026-10-02-reg-058-paired-controls-plan.md)
is invalid: all 24 prompts changed `source_original` but kept the old
natural `source_for_translation`. The [failure report](../reports/2026-10-02-reg-058-paired-controls-invalid.json)
and every raw request/response remain retained. It is not semantic model
evidence and must not enter a quality comparison. A new experiment ID,
fresh workspace and request hashes are required. This correction does not
reuse or rewrite the v1 outputs.

Use the same REG-058 pack SHA-256
`fcba9d337e8bdf3dd0d431cf886917bcefa999a44d9eb30fcc5450a6147ebe09`,
original 7B report SHA-256
`9ae192177dd51611f49adf7699ca4fe9677a230dc74cbdedded2618040cc193c`,
models/manifests/runtime and six positive/negative controls as v1. For
each control, replace **both** target fields `source_original` and
`source_for_translation` with the same authored Chinese text. Verify the
two fields agree before any request and again from the exact recorded
request. All original selected target slots have empty `approved_terms`
and `protected_facts`; assert that condition. Keep source-only neighbors,
target ID, parameters and counterbalanced order unchanged. The expected
meaning, natural Russian draft and prior control responses never enter a
prompt. This changes the one defective construction step, not the model
or evaluation target.

One sample per 12 controls per arm, 1.8B then 7B, fresh server each.
At most 12 chats and 24 preflights per arm, 2 minutes per chat,
15 seconds per preflight, 3 minutes server readiness and 20 minutes total.
No retries or prompt/parameter search. Keep model-format failures and
continue if infrastructure is sound. Record raw requests/responses,
rendered tokens, times, memory, hashes, accepted/rejected parsing and
explicit AI/human provenance. The corrected screen is still authored
development work, not an independent language score or release proof.

Run `task eval:regression:reg058:v2:preflight`, then
`task eval:regression:reg058:v2:probe` once. Verify with
`task eval:regression:reg058:v2:report` and
`task eval:regression:reg058:v2:check`.
